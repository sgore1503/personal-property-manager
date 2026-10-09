// Data access layer for properties + expenses.
//
// NOTE: `properties`, `expense_records`, `market_trend_data`, `time_records`,
// and `bill_records` were added via the 20260929000000_property_data_tables.sql
// migration. Until that migration has been applied to your live Supabase
// project AND you've regenerated `src/integrations/supabase/types.ts` (Lovable
// does this automatically after a migration runs; otherwise run
// `supabase gen types typescript`), the generated `Database` type won't know
// about these tables. The `db` alias below intentionally bypasses that typing
// so this file compiles either way — once types.ts is regenerated, you can
// swap `db` back to `supabase` for full type safety.
import { supabase } from "@/integrations/supabase/client";
import { Property, ExpenseRecord } from "@/types/property";

const db = supabase as any;

// --- Row <-> app-type mapping -----------------------------------------------

interface PropertyRow {
  id: string;
  name: string;
  address: string;
  type: Property['type'];
  purchase_price: number;
  current_value: number;
  monthly_rent: number;
  monthly_mortgage: number;
  interest_rate: number;
  loan_term_years: number;
  down_payment_percent: number;
  expenses: number;
  square_footage: number;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number;
  date_acquired: string;
  images: string[];
}

interface ExpenseRow {
  id: string;
  property_id: string;
  date: string;
  category: ExpenseRecord['category'];
  amount: number;
  description: string;
  is_deductible: boolean;
}

interface MarketTrendRow {
  property_id: string;
  date: string;
  value: number;
  rent_price: number;
}

function rowToProperty(
  row: PropertyRow,
  expenseRows: ExpenseRow[],
  marketTrendRows: MarketTrendRow[]
): Property {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    type: row.type,
    purchasePrice: Number(row.purchase_price),
    currentValue: Number(row.current_value),
    monthlyRent: Number(row.monthly_rent),
    monthlyMortgage: Number(row.monthly_mortgage),
    interestRate: Number(row.interest_rate),
    loanTermYears: row.loan_term_years,
    downPaymentPercent: Number(row.down_payment_percent),
    expenses: Number(row.expenses),
    squareFootage: Number(row.square_footage),
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    yearBuilt: row.year_built,
    dateAcquired: row.date_acquired,
    images: row.images ?? [],
    marketTrend: marketTrendRows.map((m) => ({
      date: m.date,
      value: Number(m.value),
      rentPrice: Number(m.rent_price),
    })),
    expenseTracking: expenseRows.map((e) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      amount: Number(e.amount),
      description: e.description,
      isDeductible: e.is_deductible,
    })),
    // time_records / bill_records tables exist but aren't wired up yet —
    // BillTracker still runs on local state only. Same pattern as expenses
    // below extends to those when you're ready.
    timeTracking: [],
    billTracking: [],
  };
}

// --- Reads -------------------------------------------------------------------

export async function fetchProperties(userId: string): Promise<Property[]> {
  const { data: propertyRows, error: propertyError } = await db
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (propertyError) throw propertyError;
  if (!propertyRows || propertyRows.length === 0) return [];

  const propertyIds = propertyRows.map((p: PropertyRow) => p.id);

  const [{ data: expenseRows, error: expenseError }, { data: trendRows, error: trendError }] =
    await Promise.all([
      db.from('expense_records').select('*').in('property_id', propertyIds),
      db.from('market_trend_data').select('*').in('property_id', propertyIds),
    ]);

  if (expenseError) throw expenseError;
  if (trendError) throw trendError;

  return (propertyRows as PropertyRow[]).map((row) =>
    rowToProperty(
      row,
      ((expenseRows as ExpenseRow[]) || []).filter((e) => e.property_id === row.id),
      ((trendRows as MarketTrendRow[]) || []).filter((m) => m.property_id === row.id)
    )
  );
}

// --- Writes ------------------------------------------------------------------

export type NewPropertyInput = Omit<
  Property,
  'id' | 'marketTrend' | 'images' | 'expenseTracking' | 'timeTracking' | 'billTracking'
>;

export async function createProperty(userId: string, input: NewPropertyInput): Promise<Property> {
  const { data, error } = await db
    .from('properties')
    .insert({
      user_id: userId,
      name: input.name,
      address: input.address,
      type: input.type,
      purchase_price: input.purchasePrice,
      current_value: input.currentValue,
      monthly_rent: input.monthlyRent,
      monthly_mortgage: input.monthlyMortgage,
      interest_rate: input.interestRate,
      loan_term_years: input.loanTermYears,
      down_payment_percent: input.downPaymentPercent,
      expenses: input.expenses,
      square_footage: input.squareFootage,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      year_built: input.yearBuilt,
      date_acquired: input.dateAcquired,
    })
    .select()
    .single();

  if (error) throw error;

  return rowToProperty(data as PropertyRow, [], []);
}

export async function deleteProperty(propertyId: string): Promise<void> {
  const { error } = await db.from('properties').delete().eq('id', propertyId);
  if (error) throw error;
}

export async function addExpenseRecord(
  propertyId: string,
  expense: Omit<ExpenseRecord, 'id'>
): Promise<ExpenseRecord> {
  const { data, error } = await db
    .from('expense_records')
    .insert({
      property_id: propertyId,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      is_deductible: expense.isDeductible,
    })
    .select()
    .single();

  if (error) throw error;

  const row = data as ExpenseRow;
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    amount: Number(row.amount),
    description: row.description,
    isDeductible: row.is_deductible,
  };
}
