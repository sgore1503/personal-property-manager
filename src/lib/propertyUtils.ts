import { Property, PropertyMetrics, RentSuggestion, MarketTrendData, TaxBenefits, PotentialProperty } from "@/types/property";

export const calculatePropertyMetrics = (property: Property): PropertyMetrics => {
  const monthlyProfit = property.monthlyRent - property.monthlyMortgage - property.expenses;
  const annualRent = property.monthlyRent * 12;
  const annualExpenses = (property.monthlyMortgage + property.expenses) * 12;
  const netAnnualIncome = annualRent - annualExpenses;
  
  const capRate = (netAnnualIncome / property.currentValue) * 100;
  const annualReturn = (netAnnualIncome / property.purchasePrice) * 100;
  const equity = property.currentValue - (property.purchasePrice * 0.8); // Assuming 20% down
  const appreciation = property.currentValue - property.purchasePrice;
  const taxBenefits = calculateTaxBenefits(property);

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

export const calculateTaxBenefits = (property: Property): TaxBenefits => {
  const currentYear = new Date().getFullYear();
  const yearAcquired = new Date(property.dateAcquired).getFullYear();
  
  // Calculate deductible expenses from tracking
  const totalDeductibleExpenses = property.expenseTracking
    .filter(expense => expense.isDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  // Annual deductions (mortgage interest, property taxes, operating expenses)
  const annualMortgageInterest = property.monthlyMortgage * 12 * 0.7; // Approximate 70% interest
  const annualPropertyTax = property.currentValue * 0.015; // 1.5% property tax rate
  const annualDeductions = annualMortgageInterest + annualPropertyTax + totalDeductibleExpenses;
  
  // Depreciation (residential 27.5 years, commercial 39 years)
  const depreciationYears = property.type === 'commercial' ? 39 : 27.5;
  const depreciationDeduction = (property.purchasePrice * 0.8) / depreciationYears; // 80% of purchase price
  
  // Estimated tax savings (assuming 25% tax bracket)
  const estimatedTaxSavings = (annualDeductions + depreciationDeduction) * 0.25;
  
  return {
    annualDeductions,
    depreciationDeduction,
    totalDeductibleExpenses,
    estimatedTaxSavings
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
  const totalRent = properties.reduce((sum, prop) => sum + prop.monthlyRent, 0);
  const totalMortgage = properties.reduce((sum, prop) => sum + prop.monthlyMortgage, 0);
  const totalExpenses = properties.reduce((sum, prop) => sum + prop.expenses, 0);
  const totalCashFlow = totalRent - totalMortgage - totalExpenses;
  const totalEquity = properties.reduce((sum, prop) => {
    const metrics = calculatePropertyMetrics(prop);
    return sum + metrics.equity;
  }, 0);
  const totalTaxSavings = properties.reduce((sum, prop) => {
    const metrics = calculatePropertyMetrics(prop);
    return sum + metrics.taxBenefits.estimatedTaxSavings;
  }, 0);
  
  return {
    totalValue,
    totalRent,
    totalCashFlow,
    totalEquity,
    totalTaxSavings,
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