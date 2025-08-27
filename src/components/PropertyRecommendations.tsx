import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, MapPin, Home, DollarSign, AlertTriangle, Star, Search } from 'lucide-react';
import { PotentialProperty } from "@/types/property";
import { supabase } from "@/integrations/supabase/client";

export const PropertyRecommendations = () => {
  const [properties, setProperties] = useState<PotentialProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('Austin');
  const [stateCode, setStateCode] = useState('TX');

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

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.functions.invoke('rentcast-opportunities', {
        body: { city, state: stateCode, limit: 8 },
      });
      if (error) throw error;
      setProperties((data?.properties || []) as PotentialProperty[]);
    } catch (e: any) {
      console.error('Failed to fetch opportunities', e);
      setError(e?.message || 'Failed to load opportunities');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Investment Opportunities
          </h2>
          <p className="text-muted-foreground mt-1">
            Live listings and quick metrics powered by Rentcast
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              aria-label="City"
            />
            <Input
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="State"
              aria-label="State"
              maxLength={2}
            />
          </div>
          <Button variant="outline" onClick={fetchOpportunities} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refine Search'}
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && properties.length === 0 && !error && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No opportunities found. Try a different city/state.
          </CardContent>
        </Card>
      )}

      {/* Top 3 Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(loading ? Array.from({ length: 3 }) : properties.slice(0, 3)).map((p: any, index: number) => (
          <Card key={p?.id || index} className="relative overflow-hidden">
            {!loading && index === 0 && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  Best ROI
                </Badge>
              </div>
            )}
            <div 
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${!loading ? (p.images?.[0] || '/placeholder.svg') : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'})` }}
            />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{!loading ? p.name : 'Loading...'}</span>
                {!loading && (
                  <Badge className={getRiskColor(p.riskLevel)}>
                    {getRiskIcon(p.riskLevel)}
                    {p.riskLevel} risk
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {!loading ? p.address : `${city}, ${stateCode}`}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {!loading ? p.projectedROI : '--'}%
                  </p>
                  <p className="text-sm text-muted-foreground">Projected ROI</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {!loading ? p.capRate : '--'}%
                  </p>
                  <p className="text-sm text-muted-foreground">Cap Rate</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Purchase Price:</span>
                  <span className="font-medium">${!loading ? Number(p.price || 0).toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Est. Monthly Rent:</span>
                  <span className="font-medium">${!loading ? Number(p.estimatedRent || 0).toLocaleString() : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Property Type:</span>
                  <span className="font-medium capitalize">{!loading ? p.type : '—'}</span>
                </div>
                {(!loading && p.bedrooms) && (
                  <div className="flex justify-between">
                    <span className="text-sm">Bed/Bath:</span>
                    <span className="font-medium">{p.bedrooms}bd / {p.bathrooms}ba</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm">Square Footage:</span>
                  <span className="font-medium">{!loading ? Number(p.squareFootage || 0).toLocaleString() : '—'} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Neighborhood:</span>
                  <span className="font-medium">{!loading ? (p.neighborhood || city) : '—'}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" disabled={loading}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Request Analysis
                </Button>
                <Button variant="outline" className="w-full" disabled={loading}>
                  <Home className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Properties */}
      {properties.length > 3 && (
        <Card>
          <CardHeader>
            <CardTitle>More Investment Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {properties.slice(3).map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-16 h-16 bg-cover bg-center rounded"
                      style={{ backgroundImage: `url(${property.images?.[0] || '/placeholder.svg'})` }}
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
                    <p className="text-sm text-muted-foreground">${Number(property.price || 0).toLocaleString()}</p>
                    <p className="text-sm">${Number(property.estimatedRent || 0).toLocaleString()}/mo rent</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Analyze
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
