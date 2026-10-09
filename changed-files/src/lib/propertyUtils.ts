import { Property, PropertyMetrics, RentSuggestion, MarketTrendData, TaxBenefits, PotentialProperty } from "@/types/property";
import {
  calculateCapRate,
  calculateCashOnCashReturn,
  calculateDSCR,
  calculateAnnualDebtService,
  calculateTaxBenefits as calculateTaxBenefitsReal,
  getLoanAmount,
  getLoanBalanceAfterYears,
} from "@/lib/financialEngine";

// Re-exported so existing imports of `calculateTaxBenefits` from this file
// keep working unchanged — the real implementation now lives in financialEngine.ts,
// driven by an actual amortization schedule instead of a flat 70%-interest guess.
export const calculateTaxBenefits = calculateTaxBenefitsReal;

export const calculatePropertyMetrics = (property: Property): PropertyMetrics => {
  // Cash flow now derives from the engine's computed mortgage payment
  // (interestRate / loanTermYears / downPaymentPercent) rather than the
  // separately hand-entered `monthlyMortgage` field, so this number stays
  // consistent with cap rate / cash-on-cash / DSCR below instead of the two
  // being able to silently disagree if someone edits one but not the other.
  const monthlyDebtService = calculateAnnualDebtService(property) / 12;
  const monthlyProfit = property.monthlyRent - monthlyDebtService - property.expenses;

  const capRate = calculateCapRate(property);
  // "annualReturn" now reflects cash-on-cash return (levered, accounts for financing)
  // rather than netIncome/purchasePrice, which ignored the loan entirely.
  const annualReturn = calculateCashOnCashReturn(property);

  // Real equity = current value minus the ACTUAL remaining loan balance from the
  // amortization schedule, not a static "assume 20% down, ignore paydown since" guess.
  const loanAmount = getLoanAmount(property);
  const currentYear = new Date().getFullYear();
  const yearAcquired = new Date(property.dateAcquired).getFullYear();
  const yearsHeld = Math.max(1, Math.min(currentYear - yearAcquired + 1, property.loanTermYears));
  const remainingBalance = getLoanBalanceAfterYears(loanAmount, property.interestRate, property.loanTermYears, yearsHeld);
  const equity = property.currentValue - remainingBalance;

  const appreciation = property.currentValue - property.purchasePrice;
  const taxBenefits = calculateTaxBenefitsReal(property);

  return {
    monthlyProfit,
    annualReturn,
    capRate,
    cashFlow: monthlyProfit,
    equity,
    appreciation,
    taxBenefits
  };
};

export const generateRentSuggestion = (property: Property): RentSuggestion => {
  const baseRate = property.currentValue * 0.01 / 12; // 1% rule approximation
  const marketFactors = [
    "Local market demand",
    "Property condition and amenities",
    "Comparable rental properties",
    "Seasonal trends"
  ];
  
  const variance = 0.1; // 10% variance
  const currentMarketRate = baseRate * (1 + (Math.random() - 0.5) * variance);
  const suggested = Math.round(currentMarketRate / 50) * 50; // Round to nearest $50
  
  const difference = Math.abs(property.monthlyRent - suggested) / property.monthlyRent;
  const confidence = difference < 0.05 ? 'high' : difference < 0.15 ? 'medium' : 'low';

  return {
    currentMarketRate: Math.round(currentMarketRate),
    suggested,
    confidence,
    factors: marketFactors
  };
};

export const generateMarketTrendData = (property: Property): MarketTrendData[] => {
  const months = 12;
  const data: MarketTrendData[] = [];
  const today = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const trend = (Math.random() - 0.5) * 0.02; // ±1% monthly variation
    const baseValue = property.currentValue * (1 - (i * 0.008)); // Slight appreciation over time
    const value = Math.round(baseValue * (1 + trend));
    const rentVariation = (Math.random() - 0.5) * 0.05; // ±2.5% rent variation
    const rentPrice = Math.round(property.monthlyRent * (1 + rentVariation));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value,
      rentPrice
    });
  }
  
  return data;
};

export const calculatePortfolioMetrics = (properties: Property[]) => {
  const totalValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
  const totalPurchasePrice = properties.reduce((sum, prop) => sum + prop.purchasePrice, 0);
  const totalRent = properties.reduce((sum, prop) => sum + prop.monthlyRent, 0);
  const totalExpenses = properties.reduce((sum, prop) => sum + prop.expenses, 0);
  const totalAnnualDebtService = properties.reduce((sum, prop) => sum + calculateAnnualDebtService(prop), 0);
  const totalCashInvested = properties.reduce(
    (sum, prop) => sum + prop.purchasePrice * (prop.downPaymentPercent / 100),
    0
  );
  // Monthly cash flow now derives from the same engine-computed debt service
  // used everywhere else, instead of the separately hand-entered monthlyMortgage
  // field, so this figure can't silently drift out of sync with cap rate/DSCR.
  const totalCashFlow = totalRent - totalAnnualDebtService / 12 - totalExpenses;
  const totalEquity = properties.reduce((sum, prop) => {
    const metrics = calculatePropertyMetrics(prop);
    return sum + metrics.equity;
  }, 0);
  const totalTaxSavings = properties.reduce((sum, prop) => {
    const metrics = calculatePropertyMetrics(prop);
    return sum + metrics.taxBenefits.estimatedTaxSavings;
  }, 0);

  // Portfolio-level cash-on-cash = total annual cash flow / total cash actually
  // invested across all properties (not a flat 20%-of-value guess).
  const portfolioCashOnCash = totalCashInvested > 0 ? ((totalCashFlow * 12) / totalCashInvested) * 100 : 0;

  // Portfolio-level DSCR = combined NOI / combined debt service, not an average
  // of per-property ratios (which would weight a tiny property the same as a big one).
  const totalNOI = totalRent * 12 - totalExpenses * 12;
  const portfolioDSCR = totalAnnualDebtService > 0 ? totalNOI / totalAnnualDebtService : Infinity;

  return {
    totalValue,
    totalPurchasePrice,
    totalRent,
    totalCashFlow,
    totalCashInvested,
    totalAnnualDebtService,
    totalEquity,
    totalTaxSavings,
    portfolioCashOnCash,
    portfolioDSCR,
    propertyCount: properties.length,
    averageCapRate: properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + calculatePropertyMetrics(prop).capRate, 0) / properties.length : 0
  };
};

export const generatePotentialProperties = (): PotentialProperty[] => {
  const neighborhoods = ['Downtown', 'Midtown', 'Suburbs', 'University District', 'Waterfront'];
  const types: ('apartment' | 'house' | 'condo' | 'commercial')[] = ['apartment', 'house', 'condo', 'commercial'];
  
  return Array.from({ length: 8 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const basePrice = 150000 + (Math.random() * 400000);
    const estimatedRent = basePrice * 0.01 * (0.8 + Math.random() * 0.4); // 0.8% - 1.2% rent-to-price ratio
    const projectedROI = ((estimatedRent * 12) / basePrice) * 100;
    const capRate = projectedROI * (0.6 + Math.random() * 0.3); // Cap rate typically lower than gross ROI
    
    const riskLevel: 'low' | 'medium' | 'high' = projectedROI > 12 ? 'high' : projectedROI > 8 ? 'medium' : 'low';
    
    return {
      id: `potential-${i + 1}`,
      name: `Investment Property ${i + 1}`,
      address: `${Math.floor(Math.random() * 9999)} ${neighborhoods[Math.floor(Math.random() * neighborhoods.length)]} Ave`,
      type,
      price: Math.round(basePrice),
      estimatedRent: Math.round(estimatedRent),
      projectedROI: Math.round(projectedROI * 10) / 10,
      capRate: Math.round(capRate * 10) / 10,
      squareFootage: 800 + Math.floor(Math.random() * 1500),
      bedrooms: type === 'commercial' ? undefined : 1 + Math.floor(Math.random() * 4),
      bathrooms: type === 'commercial' ? undefined : 1 + Math.floor(Math.random() * 3),
      yearBuilt: 1980 + Math.floor(Math.random() * 40),
      neighborhood: neighborhoods[Math.floor(Math.random() * neighborhoods.length)],
      riskLevel,
      images: [`https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop`]
    };
  }).sort((a, b) => b.projectedROI - a.projectedROI);
};