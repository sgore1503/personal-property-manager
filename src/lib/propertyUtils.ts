import { Property, PropertyMetrics, RentSuggestion, MarketTrendData } from "@/types/property";

export const calculatePropertyMetrics = (property: Property): PropertyMetrics => {
  const monthlyProfit = property.monthlyRent - property.monthlyMortgage - property.expenses;
  const annualRent = property.monthlyRent * 12;
  const annualExpenses = (property.monthlyMortgage + property.expenses) * 12;
  const netAnnualIncome = annualRent - annualExpenses;
  
  const capRate = (netAnnualIncome / property.currentValue) * 100;
  const annualReturn = (netAnnualIncome / property.purchasePrice) * 100;
  const equity = property.currentValue - (property.purchasePrice * 0.8); // Assuming 20% down
  const appreciation = property.currentValue - property.purchasePrice;

  return {
    monthlyProfit,
    annualReturn,
    capRate,
    cashFlow: monthlyProfit,
    equity,
    appreciation
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
  
  return {
    totalValue,
    totalRent,
    totalCashFlow,
    totalEquity,
    propertyCount: properties.length,
    averageCapRate: properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + calculatePropertyMetrics(prop).capRate, 0) / properties.length : 0
  };
};