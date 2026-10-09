import { Property, AmortizationEntry, YearlyProjection, InvestmentProjection, TaxBenefits } from "@/types/property";

// ============================================================================
// Mortgage math
// ============================================================================

/**
 * Standard fixed-rate mortgage payment formula:
 *   M = P * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
 * where P = loan principal, r = monthly interest rate, n = number of payments.
 * This is the same formula every amortization calculator and lender uses.
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number
): number {
  const r = annualInterestRatePercent / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return loanAmount / n; // 0% loan edge case
  return (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function getLoanAmount(property: Property): number {
  return property.purchasePrice * (1 - property.downPaymentPercent / 100);
}

/**
 * Builds the full month-by-month amortization schedule: for every payment,
 * how much goes to interest vs. principal, and what the remaining balance is.
 * Early payments are mostly interest; later payments are mostly principal —
 * this is why a flat "70% is interest" assumption (the old approximation)
 * is wrong for any property not in roughly its first few years of a loan.
 */
export function buildAmortizationSchedule(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number
): AmortizationEntry[] {
  const r = annualInterestRatePercent / 100 / 12;
  const n = termYears * 12;
  const payment = calculateMonthlyPayment(loanAmount, annualInterestRatePercent, termYears);

  const schedule: AmortizationEntry[] = [];
  let balance = loanAmount;

  for (let month = 1; month <= n; month++) {
    const interest = balance * r;
    const principal = Math.min(payment - interest, balance);
    balance = Math.max(balance - principal, 0);
    schedule.push({ month, payment, principal, interest, balance });
    if (balance <= 0) break;
  }

  return schedule;
}

/** Remaining loan balance after a given number of years (for exit/payoff math). */
export function getLoanBalanceAfterYears(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number,
  yearsElapsed: number
): number {
  const schedule = buildAmortizationSchedule(loanAmount, annualInterestRatePercent, termYears);
  const monthIndex = Math.min(yearsElapsed * 12, schedule.length) - 1;
  if (monthIndex < 0) return loanAmount;
  return schedule[monthIndex]?.balance ?? 0;
}

/** Total interest and principal paid during a specific calendar year of the loan (year 1 = first 12 months). */
export function getAnnualInterestAndPrincipal(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number,
  yearNumber: number
): { interest: number; principal: number } {
  const schedule = buildAmortizationSchedule(loanAmount, annualInterestRatePercent, termYears);
  const startMonth = (yearNumber - 1) * 12 + 1;
  const endMonth = yearNumber * 12;
  const yearMonths = schedule.filter((e) => e.month >= startMonth && e.month <= endMonth);
  return {
    interest: yearMonths.reduce((sum, e) => sum + e.interest, 0),
    principal: yearMonths.reduce((sum, e) => sum + e.principal, 0),
  };
}

// ============================================================================
// Core investment metrics
// ============================================================================

/**
 * Net Operating Income = all income the property generates, minus operating
 * expenses — deliberately EXCLUDING mortgage/debt service. This is the
 * standard real-estate definition: NOI measures how the property performs
 * independent of how it's financed, which is what lets you compare two
 * properties with different loans on equal footing.
 */
export function calculateNOI(property: Property): number {
  const annualRent = property.monthlyRent * 12;
  const annualOperatingExpenses = property.expenses * 12;
  return annualRent - annualOperatingExpenses;
}

/** Cap rate = NOI / current market value. The industry-standard "unlevered" return metric. */
export function calculateCapRate(property: Property): number {
  const noi = calculateNOI(property);
  return (noi / property.currentValue) * 100;
}

/** Annual debt service = the 12 real mortgage payments, derived from the actual amortization schedule. */
export function calculateAnnualDebtService(property: Property): number {
  const loanAmount = getLoanAmount(property);
  const monthlyPayment = calculateMonthlyPayment(loanAmount, property.interestRate, property.loanTermYears);
  return monthlyPayment * 12;
}

/**
 * Cash-on-cash return = annual pre-tax cash flow / actual cash invested.
 * This is the metric investors care about most day-to-day, since it's
 * levered (accounts for financing) — unlike cap rate.
 */
export function calculateCashOnCashReturn(property: Property): number {
  const noi = calculateNOI(property);
  const annualDebtService = calculateAnnualDebtService(property);
  const annualCashFlow = noi - annualDebtService;
  const cashInvested = property.purchasePrice * (property.downPaymentPercent / 100);
  if (cashInvested <= 0) return 0;
  return (annualCashFlow / cashInvested) * 100;
}

/**
 * Debt Service Coverage Ratio = NOI / annual debt service.
 * Lenders use this to decide whether a property qualifies for financing —
 * below 1.0 means the property doesn't generate enough income to cover its
 * own mortgage payment. 1.2+ is a commonly cited healthy threshold.
 */
export function calculateDSCR(property: Property): number {
  const noi = calculateNOI(property);
  const annualDebtService = calculateAnnualDebtService(property);
  if (annualDebtService === 0) return Infinity;
  return noi / annualDebtService;
}

// ============================================================================
// Tax benefits — now driven by the real amortization schedule
// ============================================================================

export function calculateTaxBenefits(property: Property): TaxBenefits {
  const totalDeductibleExpenses = property.expenseTracking
    .filter((expense) => expense.isDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Real first-year mortgage interest, from the actual amortization schedule
  // — not a flat 70% guess. Interest is front-loaded, so this matters most
  // for newer loans and understates interest (overstates deduction) for older ones
  // if you don't recompute per year.
  const loanAmount = getLoanAmount(property);
  const yearAcquired = new Date(property.dateAcquired).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearsSinceAcquisition = Math.max(1, currentYear - yearAcquired + 1);
  const { interest: annualMortgageInterest } = getAnnualInterestAndPrincipal(
    loanAmount,
    property.interestRate,
    property.loanTermYears,
    Math.min(yearsSinceAcquisition, property.loanTermYears)
  );

  const annualPropertyTax = property.currentValue * 0.015; // still an estimate — actual rate varies by county
  const annualDeductions = annualMortgageInterest + annualPropertyTax + totalDeductibleExpenses;

  // Depreciation: IRS requires depreciating only the building, not the land
  // (land doesn't wear out). There's no way to know the land/building split
  // without an appraisal, so this assumes land = 20% of purchase price, a
  // commonly used rule-of-thumb — flagged here rather than hidden.
  const landValueAssumptionPercent = 0.20;
  const depreciableBasis = property.purchasePrice * (1 - landValueAssumptionPercent);
  const depreciationYears = property.type === 'commercial' ? 39 : 27.5; // IRS-mandated useful life
  const depreciationDeduction = depreciableBasis / depreciationYears;

  // Still an approximation: assumes a flat 25% marginal rate rather than the
  // user's real bracket, since we don't collect income/filing status.
  const estimatedTaxSavings = (annualDeductions + depreciationDeduction) * 0.25;

  return {
    annualDeductions,
    depreciationDeduction,
    totalDeductibleExpenses,
    estimatedTaxSavings,
  };
}

// ============================================================================
// IRR — the actual discounted cash flow solver
// ============================================================================

/**
 * Net Present Value of a series of cash flows at a given discount rate.
 * cashFlows[0] is the initial investment (negative), cashFlows[1..n] are
 * the returns in each subsequent period.
 */
function npv(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);
}

/**
 * IRR is the discount rate that makes NPV = 0 — there's no closed-form
 * algebraic solution, so it's found numerically. This uses bisection
 * search: it's slower than Newton-Raphson but can't diverge or fail to
 * converge the way Newton-Raphson can on unusual cash flow shapes, which
 * matters more here than raw speed for a handful of yearly cash flows.
 */
export function calculateIRR(cashFlows: number[], precision = 0.00001): number | null {
  if (cashFlows.length < 2) return null;

  let low = -0.99; // -99%, floor for the search
  let high = 10; // 1000%, ceiling for the search

  const npvLow = npv(low, cashFlows);
  const npvHigh = npv(high, cashFlows);

  // If NPV doesn't change sign across the range, there's no real root in it —
  // the cash flows never "break even" at any reasonable rate.
  if (npvLow * npvHigh > 0) return null;

  let mid = 0;
  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2;
    const npvMid = npv(mid, cashFlows);
    if (Math.abs(npvMid) < precision) return mid * 100; // return as a percent
    if (npvMid * npv(low, cashFlows) < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return mid * 100;
}

// ============================================================================
// Multi-year investment projection
// ============================================================================

export interface ProjectionAssumptions {
  holdYears: number;
  annualAppreciationPercent: number; // e.g. 3 for 3%/year
  annualRentGrowthPercent: number; // e.g. 2 for 2%/year
  sellingCostsPercent: number; // e.g. 6 for 6% (agent commission + closing costs)
}

export const DEFAULT_ASSUMPTIONS: ProjectionAssumptions = {
  holdYears: 10,
  annualAppreciationPercent: 3,
  annualRentGrowthPercent: 2,
  sellingCostsPercent: 6,
};

/**
 * Projects cash flows year by year over a hold period, including a terminal
 * sale, and computes IRR on the full series — this is what the resume claim
 * "financial modeling and investment recommendation" actually requires.
 */
export function projectInvestment(
  property: Property,
  assumptions: ProjectionAssumptions = DEFAULT_ASSUMPTIONS
): InvestmentProjection {
  const { holdYears, annualAppreciationPercent, annualRentGrowthPercent, sellingCostsPercent } = assumptions;

  const loanAmount = getLoanAmount(property);
  const downPayment = property.purchasePrice * (property.downPaymentPercent / 100);
  const closingCostsEstimate = property.purchasePrice * 0.03; // typical buyer closing costs
  const initialInvestment = downPayment + closingCostsEstimate;

  const annualDebtService = calculateAnnualDebtService(property);
  const yearlyProjections: YearlyProjection[] = [];
  const cashFlowsForIRR: number[] = [-initialInvestment];

  let propertyValue = property.currentValue;
  let annualRent = property.monthlyRent * 12;
  const annualOperatingExpenses = property.expenses * 12;

  for (let year = 1; year <= holdYears; year++) {
    propertyValue = propertyValue * (1 + annualAppreciationPercent / 100);
    annualRent = annualRent * (1 + annualRentGrowthPercent / 100);
    const noi = annualRent - annualOperatingExpenses;
    const loanBalance = getLoanBalanceAfterYears(loanAmount, property.interestRate, property.loanTermYears, year);
    const cashFlow = noi - annualDebtService;

    yearlyProjections.push({ year, noi, debtService: annualDebtService, cashFlow, loanBalance, propertyValue });

    const isLastYear = year === holdYears;
    if (isLastYear) {
      const sellingCosts = propertyValue * (sellingCostsPercent / 100);
      const netSaleProceeds = propertyValue - sellingCosts - loanBalance;
      cashFlowsForIRR.push(cashFlow + netSaleProceeds);
    } else {
      cashFlowsForIRR.push(cashFlow);
    }
  }

  const finalYear = yearlyProjections[yearlyProjections.length - 1];
  const sellingCosts = finalYear.propertyValue * (sellingCostsPercent / 100);
  const netSaleProceeds = finalYear.propertyValue - sellingCosts - finalYear.loanBalance;

  const totalCashFlow = yearlyProjections.reduce((sum, y) => sum + y.cashFlow, 0);
  const irr = calculateIRR(cashFlowsForIRR);
  const equityMultiple = (totalCashFlow + netSaleProceeds) / initialInvestment;

  return {
    holdYears,
    initialInvestment,
    yearlyProjections,
    netSaleProceeds,
    irr,
    totalCashFlow,
    equityMultiple,
  };
}
