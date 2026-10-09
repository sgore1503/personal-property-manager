import {
  Property,
  AmortizationEntry,
  YearlyProjection,
  InvestmentProjection,
  ProjectionBasis,
  TaxBenefits,
} from "@/types/property";

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

/** Remaining loan balance after a given number of monthly payments (0 = nothing paid yet). */
export function getLoanBalanceAfterMonths(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number,
  monthsElapsed: number
): number {
  const schedule = buildAmortizationSchedule(loanAmount, annualInterestRatePercent, termYears);
  const monthIndex = Math.min(Math.floor(monthsElapsed), schedule.length) - 1;
  if (monthIndex < 0) return loanAmount;
  return schedule[monthIndex]?.balance ?? 0;
}

/** Remaining loan balance after a given number of years (for exit/payoff math). */
export function getLoanBalanceAfterYears(
  loanAmount: number,
  annualInterestRatePercent: number,
  termYears: number,
  yearsElapsed: number
): number {
  return getLoanBalanceAfterMonths(loanAmount, annualInterestRatePercent, termYears, yearsElapsed * 12);
}

/**
 * Whole months between the acquisition date and `asOf`, clamped to the loan term.
 * Parses the YYYY-MM-DD string by hand: `new Date("2026-10-09")` is interpreted as
 * UTC midnight, which is still the previous evening in US time zones and would
 * make a property bought today look like it was bought yesterday.
 */
export function getMonthsHeld(dateAcquired: string, termYears: number, asOf: Date = new Date()): number {
  const [y, m, d] = dateAcquired.split("-").map(Number);
  if (!y || !m || !d) return 0;
  let months = (asOf.getFullYear() - y) * 12 + (asOf.getMonth() + 1 - m);
  if (asOf.getDate() < d) months -= 1; // the current month's payment hasn't come around yet
  return Math.max(0, Math.min(months, termYears * 12));
}

/** Loan balance remaining today, from the actual amortization schedule. */
export function getCurrentLoanBalance(property: Property, asOf: Date = new Date()): number {
  return getLoanBalanceAfterMonths(
    getLoanAmount(property),
    property.interestRate,
    property.loanTermYears,
    getMonthsHeld(property.dateAcquired, property.loanTermYears, asOf)
  );
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
 * sale, and computes IRR on the full series.
 *
 * Two starting points (`basis`), because they answer different questions:
 *
 *  - 'acquisition' (default): the clock starts the day the property was bought.
 *    Value, loan and cash invested (down payment + closing costs) all come from
 *    the purchase price, so the model is internally consistent. Starting the
 *    value at today's appraisal instead would credit the gap between purchase
 *    price and current value as instant profit on day one and overstate IRR.
 *    Answers: "how is this deal performing since I bought it?"
 *
 *  - 'today': the clock starts now. Value is the current value, the loan is
 *    wherever the amortization schedule says it is today, and the "investment"
 *    is the equity you could walk away with by selling (current value, less
 *    selling costs, less the loan balance), because that is the capital you are
 *    choosing to leave tied up. Answers: "is it worth continuing to hold this?"
 *    If that equity is zero or negative there is nothing to earn a return on,
 *    so IRR and equity multiple are reported as null.
 *
 * Both: year 1 rent is today's rent and growth applies from year 2; operating
 * expenses are held flat; debt service comes from the real payment schedule, so
 * a loan that pays off during the hold stops costing money and its balance is 0.
 */
export function projectInvestment(
  property: Property,
  assumptions: ProjectionAssumptions = DEFAULT_ASSUMPTIONS,
  basis: ProjectionBasis = 'acquisition',
  asOf: Date = new Date()
): InvestmentProjection {
  const { annualAppreciationPercent, annualRentGrowthPercent, sellingCostsPercent } = assumptions;
  // At least one whole year: a zero-year hold has no sale year to compute proceeds from.
  const holdYears = Math.max(1, Math.floor(assumptions.holdYears));

  const loanAmount = getLoanAmount(property);
  const schedule = buildAmortizationSchedule(loanAmount, property.interestRate, property.loanTermYears);
  const balanceAfter = (months: number): number =>
    months <= 0 ? loanAmount : (schedule[Math.min(months, schedule.length) - 1]?.balance ?? 0);
  const paymentsBetween = (fromMonth: number, toMonth: number): number =>
    schedule
      .filter((e) => e.month > fromMonth && e.month <= toMonth)
      .reduce((sum, e) => sum + e.principal + e.interest, 0);

  const monthsHeld = basis === 'today' ? getMonthsHeld(property.dateAcquired, property.loanTermYears, asOf) : 0;
  const startingValue = basis === 'today' ? property.currentValue : property.purchasePrice;
  const startingLoanBalance = balanceAfter(monthsHeld);

  const initialInvestment =
    basis === 'today'
      ? startingValue * (1 - sellingCostsPercent / 100) - startingLoanBalance
      : property.purchasePrice * (property.downPaymentPercent / 100) + property.purchasePrice * 0.03; // + typical buyer closing costs

  const yearlyProjections: YearlyProjection[] = [];
  const cashFlowsForIRR: number[] = [-initialInvestment];
  const annualOperatingExpenses = property.expenses * 12;

  for (let year = 1; year <= holdYears; year++) {
    const propertyValue = startingValue * Math.pow(1 + annualAppreciationPercent / 100, year);
    const annualRent = property.monthlyRent * 12 * Math.pow(1 + annualRentGrowthPercent / 100, year - 1);
    const noi = annualRent - annualOperatingExpenses;

    const monthStart = monthsHeld + (year - 1) * 12;
    const monthEnd = monthsHeld + year * 12;
    const debtService = paymentsBetween(monthStart, monthEnd);
    const loanBalance = balanceAfter(monthEnd);
    const cashFlow = noi - debtService;

    yearlyProjections.push({ year, noi, debtService, cashFlow, loanBalance, propertyValue });

    if (year === holdYears) {
      const netSale = propertyValue * (1 - sellingCostsPercent / 100) - loanBalance;
      cashFlowsForIRR.push(cashFlow + netSale);
    } else {
      cashFlowsForIRR.push(cashFlow);
    }
  }

  const finalYear = yearlyProjections[yearlyProjections.length - 1];
  const netSaleProceeds = finalYear.propertyValue * (1 - sellingCostsPercent / 100) - finalYear.loanBalance;
  const totalCashFlow = yearlyProjections.reduce((sum, y) => sum + y.cashFlow, 0);

  const hasEquityToInvest = initialInvestment > 0;
  const irr = hasEquityToInvest ? calculateIRR(cashFlowsForIRR) : null;
  const equityMultiple = hasEquityToInvest ? (totalCashFlow + netSaleProceeds) / initialInvestment : null;

  return {
    basis,
    holdYears,
    monthsHeld,
    startingValue,
    startingLoanBalance,
    initialInvestment,
    yearlyProjections,
    netSaleProceeds,
    irr,
    totalCashFlow,
    equityMultiple,
  };
}
