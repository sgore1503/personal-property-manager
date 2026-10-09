import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, TrendingUp, PiggyBank } from "lucide-react";
import { Property } from "@/types/property";
import { calculatePortfolioMetrics } from "@/lib/propertyUtils";
import { formatCurrency } from "@/lib/format";

interface PortfolioDashboardProps {
  properties: Property[];
}

export const PortfolioDashboard = ({ properties }: PortfolioDashboardProps) => {
  const metrics = calculatePortfolioMetrics(properties);

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    trend,
    trendColor = "text-success" 
  }: {
    icon: any;
    title: string;
    value: string;
    subtitle?: string;
    trend?: string;
    trendColor?: string;
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        {trend && (
          <Badge variant="secondary" className={`${trendColor} text-xs`}>
            {trend}
          </Badge>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Portfolio Overview</h2>
        <p className="text-muted-foreground">Your real estate investment performance at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Building2}
          title="Total Properties"
          value={metrics.propertyCount.toString()}
          subtitle="Active investments"
        />
        
        <MetricCard
          icon={DollarSign}
          title="Portfolio Value"
          value={`$${(metrics.totalValue / 1000000).toFixed(1)}M`}
          subtitle={formatCurrency(metrics.totalValue)}
          trend={`${metrics.totalValue >= metrics.totalPurchasePrice ? '+' : ''}${(((metrics.totalValue - metrics.totalPurchasePrice) / metrics.totalPurchasePrice) * 100).toFixed(1)}%`}
          trendColor={metrics.totalValue >= metrics.totalPurchasePrice ? "text-success" : "text-destructive"}
        />
        
        <MetricCard
          icon={TrendingUp}
          title="Monthly Cash Flow"
          value={formatCurrency(metrics.totalCashFlow)}
          subtitle="After all expenses"
          trend={metrics.totalCashFlow > 0 ? "+Positive" : "Negative"}
          trendColor={metrics.totalCashFlow > 0 ? "text-success" : "text-destructive"}
        />
        
        <MetricCard
          icon={PiggyBank}
          title="Total Equity"
          value={`$${(metrics.totalEquity / 1000).toFixed(0)}K`}
          subtitle={`${metrics.totalValue > 0 ? ((metrics.totalEquity / metrics.totalValue) * 100).toFixed(0) : 0}% of value`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Cap Rate</span>
              <span className="font-semibold text-foreground">{metrics.averageCapRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Rent Income</span>
              <span className="font-semibold text-success">{formatCurrency(metrics.totalRent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Annual Cash Flow</span>
              <span className={`font-semibold ${metrics.totalCashFlow > 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(metrics.totalCashFlow * 12)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cash-on-Cash Return</span>
              <span className="font-semibold text-foreground">
                {metrics.portfolioCashOnCash.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Debt Service Coverage Ratio</span>
              <span className={`font-semibold ${metrics.portfolioDSCR >= 1.2 ? 'text-success' : metrics.portfolioDSCR >= 1 ? 'text-foreground' : 'text-destructive'}`}>
                {isFinite(metrics.portfolioDSCR) ? metrics.portfolioDSCR.toFixed(2) : '—'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Portfolio Distribution</h3>
          <div className="space-y-3">
            {properties.map((property, index) => {
              const percentage = (property.currentValue / metrics.totalValue) * 100;
              return (
                <div key={property.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{property.name}</span>
                    <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};