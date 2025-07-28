import { Property } from "@/types/property";
import { generateMarketTrendData } from "@/lib/propertyUtils";

export const mockProperties: Property[] = [
  {
    id: "1",
    name: "Sunset Apartments",
    address: "123 Sunset Blvd, Los Angeles, CA 90028",
    type: "apartment",
    purchasePrice: 450000,
    currentValue: 485000,
    monthlyRent: 3200,
    monthlyMortgage: 2100,
    expenses: 450,
    squareFootage: 1200,
    bedrooms: 2,
    bathrooms: 2,
    yearBuilt: 2018,
    dateAcquired: "2022-03-15",
    marketTrend: [],
    images: []
  },
  {
    id: "2",
    name: "Downtown Loft",
    address: "456 Main St, Seattle, WA 98101",
    type: "condo",
    purchasePrice: 380000,
    currentValue: 395000,
    monthlyRent: 2800,
    monthlyMortgage: 1800,
    expenses: 320,
    squareFootage: 900,
    bedrooms: 1,
    bathrooms: 1,
    yearBuilt: 2020,
    dateAcquired: "2023-01-20",
    marketTrend: [],
    images: []
  },
  {
    id: "3",
    name: "Oak Street Duplex",
    address: "789 Oak St, Austin, TX 78701",
    type: "house",
    purchasePrice: 320000,
    currentValue: 340000,
    monthlyRent: 2400,
    monthlyMortgage: 1500,
    expenses: 380,
    squareFootage: 1600,
    bedrooms: 3,
    bathrooms: 2.5,
    yearBuilt: 2015,
    dateAcquired: "2021-11-08",
    marketTrend: [],
    images: []
  },
  {
    id: "4",
    name: "Riverside Commercial",
    address: "321 River Rd, Portland, OR 97201",
    type: "commercial",
    purchasePrice: 650000,
    currentValue: 680000,
    monthlyRent: 4500,
    monthlyMortgage: 3200,
    expenses: 750,
    squareFootage: 3000,
    yearBuilt: 2010,
    dateAcquired: "2020-08-12",
    marketTrend: [],
    images: []
  }
];

// Generate market trend data for each property
mockProperties.forEach(property => {
  property.marketTrend = generateMarketTrendData(property);
});