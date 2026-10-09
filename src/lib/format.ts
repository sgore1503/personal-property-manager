/**
 * Formats a dollar amount in whole dollars with thousands separators.
 *
 * Calculated figures (cash flow, tax savings, portfolio sums) are floating-point
 * numbers, and `Number.prototype.toLocaleString()` will happily print up to
 * three decimals for them ("$3,962.514"). Money should be rounded for display,
 * not truncated in the calculation, so the engine keeps full precision and
 * only the display layer rounds.
 *
 * Negative amounts render as "-$330" rather than "$-330".
 */
export const formatCurrency = (amount: number): string => {
  if (!Number.isFinite(amount)) return "—";
  const rounded = Math.round(Math.abs(amount));
  // Avoid printing "-$0" for tiny negative values that round to zero.
  const sign = amount < 0 && rounded !== 0 ? "-" : "";
  return `${sign}$${rounded.toLocaleString("en-US")}`;
};
