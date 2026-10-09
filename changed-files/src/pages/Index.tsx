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

import { Property } from "@/types/property";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { fetchProperties, createProperty, addExpenseRecord, NewPropertyInput } from "@/lib/propertyData";
import { LogOut, Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    setPropertiesLoading(true);
    fetchProperties(user.id)
      .then((data) => {
        if (!cancelled) setProperties(data);
      })
      .catch((error) => {
        console.error("Failed to load properties", error);
        toast({
          title: "Couldn't load properties",
          description: error?.message || "Please refresh and try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setPropertiesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const handleAddProperty = async (newPropertyData: NewPropertyInput) => {
    if (!user) return;
    try {
      const created = await createProperty(user.id, newPropertyData);
      setProperties((prev) => [created, ...prev]);
      toast({ title: "Property added", description: `${created.name} was saved to your portfolio.` });
    } catch (error: any) {
      console.error("Failed to create property", error);
      toast({
        title: "Couldn't save property",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddExpense = async (propertyId: string, expense: Parameters<typeof addExpenseRecord>[1]) => {
    try {
      const saved = await addExpenseRecord(propertyId, expense);
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId ? { ...p, expenseTracking: [...p.expenseTracking, saved] } : p
        )
      );
    } catch (error: any) {
      console.error("Failed to save expense", error);
      toast({
        title: "Couldn't save expense",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
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
            ) : propertiesLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
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
              onAddExpense={handleAddExpense}
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