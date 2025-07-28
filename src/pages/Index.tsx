import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, BarChart3 } from "lucide-react";
import { Property } from "@/types/property";
import { PropertyCard } from "@/components/PropertyCard";
import { PortfolioDashboard } from "@/components/PortfolioDashboard";
import { PropertyTrendChart } from "@/components/PropertyTrendChart";
import { RentCalculator } from "@/components/RentCalculator";
import { AddPropertyForm } from "@/components/AddPropertyForm";
import { mockProperties } from "@/data/mockData";
import heroImage from "@/assets/hero-properties.jpg";

const Index = () => {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'properties' | 'details'>('dashboard');

  const handleAddProperty = (newPropertyData: Omit<Property, 'id' | 'marketTrend' | 'images'>) => {
    const newProperty: Property = {
      ...newPropertyData,
      id: Date.now().toString(),
      marketTrend: [],
      images: []
    };
    setProperties([...properties, newProperty]);
    setShowAddForm(false);
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setCurrentView('details');
  };

  const renderContent = () => {
    if (showAddForm) {
      return (
        <AddPropertyForm
          onAddProperty={handleAddProperty}
          onCancel={() => setShowAddForm(false)}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <PortfolioDashboard properties={properties} />;
      
      case 'properties':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Property Portfolio</h2>
                <p className="text-muted-foreground">Manage and track your real estate investments</p>
              </div>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </div>
        );
      
      case 'details':
        if (!selectedProperty) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setCurrentView('properties')}>
                ← Back to Properties
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedProperty.name}</h2>
                <p className="text-muted-foreground">{selectedProperty.address}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PropertyTrendChart
                data={selectedProperty.marketTrend}
                title="Market Value & Rent Trends"
              />
              <RentCalculator property={selectedProperty} />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-primary to-primary/80 overflow-hidden">
        <img
          src={heroImage}
          alt="Property Management"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-2">Property Management Suite</h1>
            <p className="text-lg opacity-90">Track market trends, optimize rent pricing, and maximize your real estate ROI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg text-foreground">PropertyPro</span>
              </div>
              <nav className="flex space-x-6">
                <Button
                  variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('dashboard')}
                  className="text-sm"
                >
                  Dashboard
                </Button>
                <Button
                  variant={currentView === 'properties' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('properties')}
                  className="text-sm"
                >
                  Properties
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {properties.length} Properties
              </Badge>
              {!showAddForm && currentView === 'properties' && (
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
