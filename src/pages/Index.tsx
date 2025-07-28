import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioDashboard } from "@/components/PortfolioDashboard";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyTrendChart } from "@/components/PropertyTrendChart";
import { RentCalculator } from "@/components/RentCalculator";
import { AddPropertyForm } from "@/components/AddPropertyForm";
import { AIChatConsultant } from "@/components/AIChatConsultant";
import { ExpenseTracker } from "@/components/ExpenseTracker";
import { PropertyRecommendations } from "@/components/PropertyRecommendations";
import { mockProperties } from "@/data/mockData";
import { Property } from "@/types/property";
import { generateMarketTrendData } from "@/lib/propertyUtils";

const Index = () => {
  const [properties, setProperties] = useState<Property[]>(
    mockProperties.map(property => ({
      ...property,
      marketTrend: generateMarketTrendData(property)
    }))
  );
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const handleAddProperty = (newPropertyData: Omit<Property, 'id' | 'marketTrend' | 'images' | 'expenseTracking' | 'timeTracking'>) => {
    const newProperty: Property = {
      ...newPropertyData,
      id: Date.now().toString(),
      marketTrend: generateMarketTrendData({
        ...newPropertyData,
        id: Date.now().toString(),
        marketTrend: [],
        images: [],
        expenseTracking: [],
        timeTracking: []
      }),
      images: [],
      expenseTracking: [],
      timeTracking: []
    };
    setProperties([...properties, newProperty]);
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Property Management Dashboard
        </h1>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="add-property">Add Property</TabsTrigger>
            <TabsTrigger value="ai-consultant">AI Consultant</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <PortfolioDashboard properties={properties} />
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {selectedProperty ? (
              <PropertyTrendChart
                data={selectedProperty.marketTrend}
                title={`${selectedProperty.name} - Market Analysis`}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a property to view detailed analytics</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            {selectedProperty ? (
              <RentCalculator property={selectedProperty} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a property to calculate rent suggestions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            {selectedProperty ? (
              <ExpenseTracker 
                property={selectedProperty} 
                onUpdateProperty={(updatedProperty) => {
                  setProperties(properties.map(p => 
                    p.id === updatedProperty.id ? updatedProperty : p
                  ));
                  setSelectedProperty(updatedProperty);
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a property to track expenses and time</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <PropertyRecommendations />
          </TabsContent>

          <TabsContent value="add-property" className="space-y-6">
            <AddPropertyForm onAddProperty={handleAddProperty} onCancel={() => {}} />
          </TabsContent>

          <TabsContent value="ai-consultant" className="space-y-6">
            <AIChatConsultant properties={properties} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;