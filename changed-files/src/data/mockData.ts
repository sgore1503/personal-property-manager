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
    interestRate: 6.5,
    loanTermYears: 30,
    downPaymentPercent: 20,
    expenses: 450,
    squareFootage: 1200,
    bedrooms: 2,
    bathrooms: 2,
    yearBuilt: 2018,
    dateAcquired: "2022-03-15",
    marketTrend: [],
    images: [],
    expenseTracking: [
      {
        id: "exp1",
        date: "2024-01-15",
        category: "maintenance",
        amount: 850,
        description: "HVAC system maintenance and filter replacement",
        isDeductible: true
      },
      {
        id: "exp2",
        date: "2024-02-20",
        category: "repair",
        amount: 1200,
        description: "Plumbing repair in unit 2B",
        isDeductible: true
      }
    ],
    timeTracking: [
      {
        id: "time1",
        date: "2024-01-20",
        hours: 3,
        activity: "Property inspection and tenant communication",
        hourlyRate: 50
      }
    ],
    billTracking: [
      {
        id: "bill1",
        name: "Property Insurance",
        category: "insurance",
        amount: 180,
        dueDate: "2024-03-15",
        frequency: "monthly",
        isPaid: false,
        notes: "Annual property insurance premium",
        autoPayEnabled: true
      },
      {
        id: "bill2",
        name: "HOA Fees",
        category: "management",
        amount: 250,
        dueDate: "2024-03-01",
        frequency: "monthly",
        isPaid: true,
        lastPaidDate: "2024-02-28",
        notes: "Monthly HOA management fee",
        autoPayEnabled: true
      }
    ]
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
    interestRate: 6.5,
    loanTermYears: 30,
    downPaymentPercent: 20,
    expenses: 320,
    squareFootage: 900,
    bedrooms: 1,
    bathrooms: 1,
    yearBuilt: 2020,
    dateAcquired: "2023-01-20",
    marketTrend: [],
    images: [],
    expenseTracking: [
      {
        id: "exp3",
        date: "2024-01-10",
        category: "improvement",
        amount: 2500,
        description: "Kitchen renovation - new appliances",
        isDeductible: true
      }
    ],
    timeTracking: [
      {
        id: "time2",
        date: "2024-01-15",
        hours: 2,
        activity: "Tenant screening and lease preparation"
      }
    ],
    billTracking: [
      {
        id: "bill3",
        name: "Electricity Bill",
        category: "utilities",
        amount: 95,
        dueDate: "2024-03-10",
        frequency: "monthly",
        isPaid: false,
        notes: "Monthly electricity for common areas",
        autoPayEnabled: false
      }
    ]
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
    interestRate: 6.5,
    loanTermYears: 30,
    downPaymentPercent: 20,
    expenses: 380,
    squareFootage: 1600,
    bedrooms: 3,
    bathrooms: 2.5,
    yearBuilt: 2015,
    dateAcquired: "2021-11-08",
    marketTrend: [],
    images: [],
    expenseTracking: [
      {
        id: "exp4",
        date: "2024-02-05",
        category: "management",
        amount: 300,
        description: "Property management fee",
        isDeductible: true
      }
    ],
    timeTracking: [
      {
        id: "time3",
        date: "2024-02-01",
        hours: 1.5,
        activity: "Monthly property review and maintenance check"
      }
    ],
    billTracking: [
      {
        id: "bill4",
        name: "Property Taxes",
        category: "taxes",
        amount: 420,
        dueDate: "2024-04-01",
        frequency: "quarterly",
        isPaid: false,
        notes: "Quarterly property tax payment",
        autoPayEnabled: false
      },
      {
        id: "bill5",
        name: "Water & Sewer",
        category: "utilities",
        amount: 65,
        dueDate: "2024-02-25",
        frequency: "monthly",
        isPaid: true,
        lastPaidDate: "2024-02-20",
        notes: "Monthly water and sewer bill",
        autoPayEnabled: true
      }
    ]
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
    interestRate: 6.5,
    loanTermYears: 30,
    downPaymentPercent: 20,
    expenses: 750,
    squareFootage: 3000,
    yearBuilt: 2010,
    dateAcquired: "2020-08-12",
    marketTrend: [],
    images: [],
    expenseTracking: [],
    timeTracking: [],
    billTracking: [
      {
        id: "bill6",
        name: "Commercial Insurance",
        category: "insurance",
        amount: 450,
        dueDate: "2024-03-20",
        frequency: "monthly",
        isPaid: false,
        notes: "Monthly commercial property insurance",
        autoPayEnabled: true
      }
    ]
  }
];

// Generate market trend data for each property
mockProperties.forEach(property => {
  property.marketTrend = generateMarketTrendData(property);
});