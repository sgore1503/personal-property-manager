export interface Property {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'condo' | 'commercial';
  purchasePrice: number;
  currentValue: number;
  monthlyRent: number;
  monthlyMortgage: number;
  expenses: number;
  squareFootage: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt: number;
  dateAcquired: string;
  marketTrend: MarketTrendData[];
  images: string[];
}

export interface MarketTrendData {
  date: string;
  value: number;
  rentPrice: number;
}

export interface RentSuggestion {
  currentMarketRate: number;
  suggested: number;
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
}

export interface PropertyMetrics {
  monthlyProfit: number;
  annualReturn: number;
  capRate: number;
  cashFlow: number;
  equity: number;
  appreciation: number;
}