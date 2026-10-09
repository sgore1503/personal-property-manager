import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Property, InvestmentProjection as ProjectionResult, ProjectionBasis } from "@/types/property";
import {
  projectInvestment,
  calculateNOI,
  calculateCapRate,
  calculateCashOnCashReturn,
  calculateDSCR,
  DEFAULT_ASSUMPTIONS,
  ProjectionAssumptions,
} from "@/lib/financialEngine";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

interface InvestmentProjectionProps {
  property: Property;
}

const formatIrr = (p: ProjectionResult) => (p.irr !== null ? `${p.irr.toFixed(2)}%` : "N/A");
const formatMultiple = (p: ProjectionResult) => (p.equityMultiple !== null ? `${p.equityMultiple.toFixed(2)}x` : "N/A");

const StatCard = ({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) => (
  <div className="p-3 bg-muted/50 rounded-lg">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className={`text-lg font-semibold ${positive === undefined ? 'text-foreground' : positive ? 'text-success' : 'text-destructive'}`}>
      {value}
    </div>
    {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

// One of the two starting-point choices. Shows its own headline result, so both
// are visible at once, and acts as a radio button that picks which one the
// detail below describes.
const BasisCard = ({
  title,
  caption,
  projection,
  selected,
  onSelect,
}: {
  title: string;
  caption: string;
  projection: ProjectionResult;
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onSelect}
    className={`text-left p-4 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-muted/50"
    }`}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span
        className={`h-3 w-3 rounded-full border ${selected ? "border-primary bg-primary" : "border-muted-foreground"}`}
        aria-hidden="true"
      />
    </div>
    <div className="text-xs text-muted-foreground mb-3">{caption}</div>
    <div className="flex items-baseline gap-4">
      <div>
        <div
          className={`text-2xl font-bold ${
            projection.irr === null ? "text-muted-foreground" : projection.irr > 0 ? "text-success" : "text-destructive"
          }`}
        >
          {formatIrr(projection)}
        </div>
        <div className="text-xs text-muted-foreground">IRR</div>
      </div>
      <div>
        <div className="text-lg font-semibold text-foreground">{formatMultiple(projection)}</div>
        <div className="text-xs text-muted-foreground">Equity multiple</div>
      </div>
    </div>
  </button>
);

export const InvestmentProjection = ({ property }: InvestmentProjectionProps) => {
  const [assumptions, setAssumptions] = useState<ProjectionAssumptions>(DEFAULT_ASSUMPTIONS);
  const [basis, setBasis] = useState<ProjectionBasis>("acquisition");

  const current = useMemo(() => ({
    noi: calculateNOI(property),
    capRate: calculateCapRate(property),
    cashOnCash: calculateCashOnCashReturn(property),
    dscr: calculateDSCR(property),
  }), [property]);

  const projections = useMemo(
    () => ({
      acquisition: projectInvestment(property, assumptions, "acquisition"),
      today: projectInvestment(property, assumptions, "today"),
    }),
    [property, assumptions]
  );
  const projection = projections[basis];

  const updateAssumption = (field: keyof ProjectionAssumptions, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    // The hold period must be a whole number of years, at least 1.
    const next = field === "holdYears" ? Math.min(50, Math.max(1, Math.floor(num))) : num;
    setAssumptions((prev) => ({ ...prev, [field]: next }));
  };

  const monthsText =
    projection.monthsHeld === 0
      ? "no loan payments made yet"
      : `${projection.monthsHeld} loan payment${projection.monthsHeld === 1 ? "" : "s"} made`;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Current Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Annual NOI" value={formatCurrency(current.noi)} />
          <StatCard label="Cap Rate" value={`${current.capRate.toFixed(2)}%`} />
          <StatCard label="Cash-on-Cash" value={`${current.cashOnCash.toFixed(2)}%`} positive={current.cashOnCash > 0} />
          <StatCard
            label="DSCR"
            value={isFinite(current.dscr) ? current.dscr.toFixed(2) : '—'}
            sub={current.dscr >= 1.2 ? 'Healthy' : current.dscr >= 1 ? 'Thin' : 'Below 1.0'}
            positive={current.dscr >= 1.2}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Hold Period Assumptions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="holdYears" className="text-xs">Hold Period (yrs)</Label>
            <Input id="holdYears" type="number" min={1} max={50} value={assumptions.holdYears}
              onChange={(e) => updateAssumption('holdYears', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="appreciation" className="text-xs">Appreciation (%/yr)</Label>
            <Input id="appreciation" type="number" step="0.1" value={assumptions.annualAppreciationPercent}
              onChange={(e) => updateAssumption('annualAppreciationPercent', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="rentGrowth" className="text-xs">Rent Growth (%/yr)</Label>
            <Input id="rentGrowth" type="number" step="0.1" value={assumptions.annualRentGrowthPercent}
              onChange={(e) => updateAssumption('annualRentGrowthPercent', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="sellingCosts" className="text-xs">Selling Costs (%)</Label>
            <Input id="sellingCosts" type="number" step="0.1" value={assumptions.sellingCostsPercent}
              onChange={(e) => updateAssumption('sellingCostsPercent', e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Projection Starting Point ({assumptions.holdYears}-Year Hold)
        </h4>
        <div role="radiogroup" aria-label="Projection starting point" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <BasisCard
            title="From acquisition"
            caption="Purchase price and the cash you put in"
            projection={projections.acquisition}
            selected={basis === "acquisition"}
            onSelect={() => setBasis("acquisition")}
          />
          <BasisCard
            title="From today"
            caption="Current value and the equity you'd keep by not selling"
            projection={projections.today}
            selected={basis === "today"}
            onSelect={() => setBasis("today")}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {basis === "acquisition"
            ? "How the deal performs measured from the day you bought it: value, loan and cash invested all come from the purchase price."
            : "Whether continuing to hold is worth it: value starts at today's estimate and the investment is the equity you could cash out now, after selling costs."}
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Projected Return ({basis === "acquisition" ? "from acquisition" : "from today"})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Projected IRR"
            value={formatIrr(projection)}
            sub={
              projection.irr === null
                ? projection.initialInvestment <= 0
                  ? "No positive equity to invest"
                  : "Didn't converge for these inputs"
                : undefined
            }
            positive={projection.irr !== null && projection.irr > 0}
          />
          <StatCard label="Equity Multiple" value={formatMultiple(projection)} />
          <StatCard
            label={basis === "acquisition" ? "Cash Invested" : "Equity Today"}
            value={formatCurrency(projection.initialInvestment)}
            sub={basis === "acquisition" ? "Down payment + 3% closing costs" : "Value − loan − selling costs"}
          />
          <StatCard label="Net Sale Proceeds" value={formatCurrency(projection.netSaleProceeds)} sub={`In year ${projection.holdYears}`} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Starting value {formatCurrency(projection.startingValue)} · loan balance{" "}
          {formatCurrency(projection.startingLoanBalance)} ({monthsText})
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Year-by-Year Projection</h4>
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>NOI</TableHead>
                <TableHead>Debt Service</TableHead>
                <TableHead>Cash Flow</TableHead>
                <TableHead>Loan Balance</TableHead>
                <TableHead>Property Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projection.yearlyProjections.map((y) => (
                <TableRow key={y.year}>
                  <TableCell>{y.year}</TableCell>
                  <TableCell>{formatCurrency(y.noi)}</TableCell>
                  <TableCell>{formatCurrency(y.debtService)}</TableCell>
                  <TableCell className={y.cashFlow >= 0 ? 'text-success' : 'text-destructive'}>
                    <span className="inline-flex items-center gap-1">
                      {y.cashFlow >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatCurrency(y.cashFlow)}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(y.loanBalance)}</TableCell>
                  <TableCell>{formatCurrency(y.propertyValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Year 1 uses today's rent and growth starts in year 2. Appreciation and rent growth are fixed annual rates rather
        than real market volatility, operating expenses are held flat, and the model assumes full occupancy and no
        repair reserve, so treat it as a planning model, not a guarantee. IRR accounts for the initial cash outlay, all
        yearly cash flows, and net proceeds from a sale at the end of the hold period after paying off the remaining
        loan balance and selling costs. Debt service follows the real payment schedule, so it stops when the loan is
        paid off.
      </p>
    </div>
  );
};
