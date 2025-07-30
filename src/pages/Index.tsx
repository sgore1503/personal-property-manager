import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PortfolioDashboard } from "@/components/PortfolioDashboard";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyDetailsDialog } from "@/components/PropertyDetailsDialog";
import { AddPropertyForm } from "@/components/AddPropertyForm";
import { AIChatConsultant } from "@/components/AIChatConsultant";
import { ExpenseOverview } from "@/components/ExpenseOverview";
import { PropertyRecommendations } from "@/components/PropertyRecommendations";
import { mockProperties } from "@/data/mockData";
import { Property } from "@/types/property";
import { generateMarketTrendData } from "@/lib/propertyUtils";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>(
    mockProperties.map(property => ({
      ...property,
      marketTrend: generateMarketTrendData(property)
    }))
  );
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
    setDetailsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Property Management Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="ai-consultant">AI Consultant</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <PortfolioDashboard properties={properties} />
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {showAddForm ? (
              <AddPropertyForm 
                onAddProperty={(newPropertyData) => {
                  handleAddProperty(newPropertyData);
                  setShowAddForm(false);
                }} 
                onCancel={() => setShowAddForm(false)} 
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
                <div className="flex justify-center mt-8">
                  <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Property
                  </Button>
                </div>
              </>
            )}
          </TabsContent>


          <TabsContent value="expenses" className="space-y-6">
            <ExpenseOverview 
              properties={properties} 
              onUpdateProperty={(updatedProperty) => {
                setProperties(properties.map(p => 
                  p.id === updatedProperty.id ? updatedProperty : p
                ));
              }}
            />
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <PropertyRecommendations />
          </TabsContent>


          <TabsContent value="ai-consultant" className="space-y-6">
            <AIChatConsultant properties={properties} />
          </TabsContent>
        </Tabs>

        <PropertyDetailsDialog 
          property={selectedProperty}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      </div>
    </div>
  );
};

export default Index;