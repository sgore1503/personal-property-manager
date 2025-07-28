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
  expenseTracking: ExpenseRecord[];
  timeTracking: TimeRecord[];
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'maintenance' | 'repair' | 'improvement' | 'management' | 'insurance' | 'taxes' | 'other';
  amount: number;
  description: string;
  isDeductible: boolean;
}

export interface TimeRecord {
  id: string;
  date: string;
  hours: number;
  activity: string;
  hourlyRate?: number;
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
  taxBenefits: TaxBenefits;
}

export interface TaxBenefits {
  annualDeductions: number;
  depreciationDeduction: number;
  totalDeductibleExpenses: number;
  estimatedTaxSavings: number;
}

export interface PotentialProperty {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'condo' | 'commercial';
  price: number;
  estimatedRent: number;
  projectedROI: number;
  capRate: number;
  squareFootage: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt: number;
  neighborhood: string;
  riskLevel: 'low' | 'medium' | 'high';
  images: string[];
}