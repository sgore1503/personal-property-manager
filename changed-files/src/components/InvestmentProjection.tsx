import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Property } from "@/types/property";
import {
  projectInvestment,
  calculateNOI,
  calculateCapRate,
  calculateCashOnCashReturn,
  calculateDSCR,
  DEFAULT_ASSUMPTIONS,
  ProjectionAssumptions,
} from "@/lib/financialEngine";
import { TrendingUp, TrendingDown } from "lucide-react";

interface InvestmentProjectionProps {
  property: Property;
}

const StatCard = ({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) => (
  <div className="p-3 bg-muted/50 rounded-lg">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className={`text-lg font-semibold ${positive === undefined ? 'text-foreground' : positive ? 'text-success' : 'text-destructive'}`}>
      {value}
    </div>
    {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

export const InvestmentProjection = ({ property }: InvestmentProjectionProps) => {
  const [assumptions, setAssumptions] = useState<ProjectionAssumptions>(DEFAULT_ASSUMPTIONS);

  const current = useMemo(() => ({
    noi: calculateNOI(property),
    capRate: calculateCapRate(property),
    cashOnCash: calculateCashOnCashReturn(property),
    dscr: calculateDSCR(property),
  }), [property]);

  const projection = useMemo(() => projectInvestment(property, assumptions), [property, assumptions]);

  const updateAssumption = (field: keyof ProjectionAssumptions, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setAssumptions((prev) => ({ ...prev, [field]: num }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Current Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Annual NOI" value={`$${current.noi.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
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
            <Input id="holdYears" type="number" value={assumptions.holdYears}
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
        <h4 className="text-sm font-semibold text-foreground mb-3">Projected Return ({assumptions.holdYears}-Year Hold)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Projected IRR"
            value={projection.irr !== null ? `${projection.irr.toFixed(2)}%` : 'N/A'}
            sub={projection.irr === null ? "Didn't converge for these inputs" : undefined}
            positive={projection.irr !== null && projection.irr > 0}
          />
          <StatCard label="Equity Multiple" value={`${projection.equityMultiple.toFixed(2)}x`} />
          <StatCard label="Initial Investment" value={`$${projection.initialInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <StatCard label="Net Sale Proceeds" value={`$${projection.netSaleProceeds.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        </div>
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
                  <TableCell>${y.noi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>${y.debtService.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className={y.cashFlow >= 0 ? 'text-success' : 'text-destructive'}>
                    <span className="inline-flex items-center gap-1">
                      {y.cashFlow >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      ${y.cashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </TableCell>
                  <TableCell>${y.loanBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>${y.propertyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Projection assumes fixed annual appreciation and rent growth rates rather than real market volatility —
        treat this as a planning model, not a guarantee. IRR accounts for the initial cash investment, all yearly
        cash flows, and net proceeds from a sale at the end of the hold period after paying off the remaining loan
        balance and selling costs.
      </p>
    </div>
  );
};
