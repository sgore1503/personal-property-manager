-- ============================================================================
-- Migration: loan terms on properties
-- Adds the inputs a real amortization schedule and IRR calculation require.
-- monthly_mortgage alone isn't enough to split principal vs. interest or
-- project a future payoff balance.
-- ============================================================================

ALTER TABLE public.properties
  ADD COLUMN interest_rate NUMERIC(5, 3) NOT NULL DEFAULT 6.500
    CHECK (interest_rate >= 0 AND interest_rate <= 25),
  ADD COLUMN loan_term_years INTEGER NOT NULL DEFAULT 30
    CHECK (loan_term_years > 0 AND loan_term_years <= 50),
  ADD COLUMN down_payment_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00
    CHECK (down_payment_percent >= 0 AND down_payment_percent <= 100);

COMMENT ON COLUMN public.properties.interest_rate IS 'Annual mortgage interest rate, as a percent (e.g. 6.500 = 6.5%)';
COMMENT ON COLUMN public.properties.loan_term_years IS 'Mortgage term in years (e.g. 30)';
COMMENT ON COLUMN public.properties.down_payment_percent IS 'Down payment as a percent of purchase_price (e.g. 20.00 = 20%)';
