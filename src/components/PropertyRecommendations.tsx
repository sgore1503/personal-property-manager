import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Home, DollarSign, AlertTriangle, Star } from 'lucide-react';
import { PotentialProperty } from "@/types/property";
import { generatePotentialProperties } from "@/lib/propertyUtils";

export const PropertyRecommendations = () => {
  const potentialProperties = generatePotentialProperties();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <Star className="h-3 w-3" />;
      case 'medium': return <AlertTriangle className="h-3 w-3" />;
      case 'high': return <TrendingUp className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Investment Opportunities
          </h2>
          <p className="text-muted-foreground mt-1">
            Properties sorted by projected ROI potential
          </p>
        </div>
        <Button variant="outline">
          Refine Search
        </Button>
      </div>

      {/* Top 3 Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {potentialProperties.slice(0, 3).map((property, index) => (
          <Card key={property.id} className="relative overflow-hidden">
            {index === 0 && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  Best ROI
                </Badge>
              </div>
            )}
            <div 
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${property.images[0]})` }}
            />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{property.name}</span>
                <Badge className={getRiskColor(property.riskLevel)}>
                  {getRiskIcon(property.riskLevel)}
                  {property.riskLevel} risk
                </Badge>
              </CardTitle>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {property.projectedROI}%
                  </p>
                  <p className="text-sm text-muted-foreground">Projected ROI</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {property.capRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">Cap Rate</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Purchase Price:</span>
                  <span className="font-medium">${property.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Est. Monthly Rent:</span>
                  <span className="font-medium">${property.estimatedRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Property Type:</span>
                  <span className="font-medium capitalize">{property.type}</span>
                </div>
                {property.bedrooms && (
                  <div className="flex justify-between">
                    <span className="text-sm">Bed/Bath:</span>
                    <span className="font-medium">{property.bedrooms}bd / {property.bathrooms}ba</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm">Square Footage:</span>
                  <span className="font-medium">{property.squareFootage.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Neighborhood:</span>
                  <span className="font-medium">{property.neighborhood}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Request Analysis
                </Button>
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Properties */}
      <Card>
        <CardHeader>
          <CardTitle>More Investment Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {potentialProperties.slice(3).map((property) => (
              <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 bg-cover bg-center rounded"
                    style={{ backgroundImage: `url(${property.images[0]})` }}
                  />
                  <div>
                    <h4 className="font-medium">{property.name}</h4>
                    <p className="text-sm text-muted-foreground">{property.address}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {property.type}
                      </Badge>
                      <Badge className={`text-xs ${getRiskColor(property.riskLevel)}`}>
                        {property.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg font-bold text-green-600">{property.projectedROI}% ROI</p>
                  <p className="text-sm text-muted-foreground">${property.price.toLocaleString()}</p>
                  <p className="text-sm">${property.estimatedRent}/mo rent</p>
                </div>
                <Button size="sm" variant="outline">
                  Analyze
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};