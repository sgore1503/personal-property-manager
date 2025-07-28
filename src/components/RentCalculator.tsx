import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Property, RentSuggestion } from "@/types/property";
import { generateRentSuggestion } from "@/lib/propertyUtils";

interface RentCalculatorProps {
  property: Property;
}

export const RentCalculator = ({ property }: RentCalculatorProps) => {
  const suggestion = generateRentSuggestion(property);
  const difference = suggestion.suggested - property.monthlyRent;
  const percentDifference = (difference / property.monthlyRent) * 100;
  
  const getConfidenceIcon = () => {
    switch (suggestion.confidence) {
      case 'high': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'low': return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getConfidenceColor = () => {
    switch (suggestion.confidence) {
      case 'high': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Rent Optimization</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Rent</div>
            <div className="text-2xl font-bold text-foreground">
              ${property.monthlyRent.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Suggested Rent</div>
            <div className="text-2xl font-bold text-success">
              ${suggestion.suggested.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Potential Change</span>
          </div>
          <div className={`font-semibold ${difference >= 0 ? 'text-success' : 'text-destructive'}`}>
            {difference >= 0 ? '+' : ''}${difference.toLocaleString()} 
            <span className="text-sm ml-1">
              ({percentDifference >= 0 ? '+' : ''}{percentDifference.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Confidence Level</span>
          <Badge className={`${getConfidenceColor()} flex items-center gap-1`}>
            {getConfidenceIcon()}
            {suggestion.confidence.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">Market Factors</div>
          <div className="space-y-1">
            {suggestion.factors.map((factor, index) => (
              <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                {factor}
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Update Rent Price
        </Button>
      </div>
    </Card>
  );
};