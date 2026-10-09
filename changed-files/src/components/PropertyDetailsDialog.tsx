import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyTrendChart } from "@/components/PropertyTrendChart";
import { RentCalculator } from "@/components/RentCalculator";
import { InvestmentProjection } from "@/components/InvestmentProjection";
import { Property } from "@/types/property";

interface PropertyDetailsDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PropertyDetailsDialog = ({ property, open, onOpenChange }: PropertyDetailsDialogProps) => {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property.name} - Details</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="projection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projection">Investment Projection</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="calculator">Rent Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="projection" className="space-y-6">
            <InvestmentProjection property={property} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PropertyTrendChart
              data={property.marketTrend}
              title={`${property.name} - Market Analysis`}
            />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <RentCalculator property={property} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};