-- ============================================================================
-- Migration: property data tables
-- Moves property/expense/time/bill data from static mockData.ts into Supabase,
-- scoped per-user via RLS, matching src/types/property.ts field-for-field.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'condo', 'commercial')),
  purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
  current_value NUMERIC(12, 2) NOT NULL CHECK (current_value >= 0),
  monthly_rent NUMERIC(10, 2) NOT NULL CHECK (monthly_rent >= 0),
  monthly_mortgage NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (monthly_mortgage >= 0),
  expenses NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (expenses >= 0),
  square_footage NUMERIC(10, 2) NOT NULL CHECK (square_footage >= 0),
  bedrooms NUMERIC(4, 1),
  bathrooms NUMERIC(4, 1),
  year_built INTEGER NOT NULL,
  date_acquired DATE NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own properties"
ON public.properties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
ON public.properties FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
ON public.properties FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
ON public.properties FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_properties_user_id ON public.properties(user_id);

-- ---------------------------------------------------------------------------
-- market_trend_data  (property.marketTrend[])
-- ---------------------------------------------------------------------------
CREATE TABLE public.market_trend_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC(12, 2) NOT NULL,
  rent_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_trend_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view market trend data for their own properties"
ON public.market_trend_data FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = market_trend_data.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert market trend data for their own properties"
ON public.market_trend_data FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = market_trend_data.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE INDEX idx_market_trend_property_id ON public.market_trend_data(property_id);

-- ---------------------------------------------------------------------------
-- expense_records  (property.expenseTracking[])
-- ---------------------------------------------------------------------------
CREATE TABLE public.expense_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('maintenance', 'repair', 'improvement', 'management', 'insurance', 'taxes', 'other')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  is_deductible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses for their own properties"
ON public.expense_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = expense_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert expenses for their own properties"
ON public.expense_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = expense_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update expenses for their own properties"
ON public.expense_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = expense_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete expenses for their own properties"
ON public.expense_records FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = expense_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE INDEX idx_expense_records_property_id ON public.expense_records(property_id);

-- ---------------------------------------------------------------------------
-- time_records  (property.timeTracking[])
-- ---------------------------------------------------------------------------
CREATE TABLE public.time_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC(6, 2) NOT NULL CHECK (hours >= 0),
  activity TEXT NOT NULL,
  hourly_rate NUMERIC(8, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view time records for their own properties"
ON public.time_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = time_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert time records for their own properties"
ON public.time_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = time_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update time records for their own properties"
ON public.time_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = time_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete time records for their own properties"
ON public.time_records FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = time_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE INDEX idx_time_records_property_id ON public.time_records(property_id);

-- ---------------------------------------------------------------------------
-- bill_records  (property.billTracking[])
-- ---------------------------------------------------------------------------
CREATE TABLE public.bill_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('mortgage', 'insurance', 'utilities', 'management', 'maintenance', 'taxes', 'other')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annually', 'one-time')),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  last_paid_date DATE,
  notes TEXT,
  auto_pay_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bill_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bills for their own properties"
ON public.bill_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = bill_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert bills for their own properties"
ON public.bill_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = bill_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update bills for their own properties"
ON public.bill_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = bill_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete bills for their own properties"
ON public.bill_records FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = bill_records.property_id
    AND properties.user_id = auth.uid()
  )
);

CREATE TRIGGER update_bill_records_updated_at
BEFORE UPDATE ON public.bill_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bill_records_property_id ON public.bill_records(property_id);
