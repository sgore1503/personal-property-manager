import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Home, MapPin } from "lucide-react";
import { Property, PropertyMetrics } from "@/types/property";
import { calculatePropertyMetrics } from "@/lib/propertyUtils";

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
}

export const PropertyCard = ({ property, onViewDetails }: PropertyCardProps) => {
  const metrics = calculatePropertyMetrics(property);
  const isPositiveCashFlow = metrics.cashFlow > 0;
  const appreciationPercent = ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100;

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-secondary/30 border-border/50">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-lg text-foreground">{property.name}</h3>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
            <MapPin className="h-3 w-3" />
            <span>{property.address}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {property.type.toUpperCase()}
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            ${property.currentValue.toLocaleString()}
          </div>
          <div className={`flex items-center gap-1 text-sm ${appreciationPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
            {appreciationPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {appreciationPercent >= 0 ? '+' : ''}{appreciationPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Monthly Rent</div>
          <div className="text-lg font-semibold text-foreground">
            ${property.monthlyRent.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Cash Flow</div>
          <div className={`text-lg font-semibold ${isPositiveCashFlow ? 'text-success' : 'text-destructive'}`}>
            {isPositiveCashFlow ? '+' : ''}${metrics.cashFlow.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="text-center p-2 bg-muted/50 rounded">
          <div className="text-muted-foreground">Cap Rate</div>
          <div className="font-semibold">{metrics.capRate.toFixed(1)}%</div>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded">
          <div className="text-muted-foreground">ROI</div>
          <div className="font-semibold">{metrics.annualReturn.toFixed(1)}%</div>
        </div>
        <div className="text-center p-2 bg-muted/50 rounded">
          <div className="text-muted-foreground">Equity</div>
          <div className="font-semibold">${(metrics.equity / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <Button 
        onClick={() => onViewDetails(property)} 
        className="w-full"
        variant="outline"
      >
        View Details
      </Button>
    </Card>
  );
};