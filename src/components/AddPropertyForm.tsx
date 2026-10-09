import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Property } from "@/types/property";
import { Plus, Home } from "lucide-react";

interface AddPropertyFormProps {
  onAddProperty: (property: Omit<Property, 'id' | 'marketTrend' | 'images' | 'expenseTracking' | 'timeTracking' | 'billTracking'>) => void;
  onCancel: () => void;
}

export const AddPropertyForm = ({ onAddProperty, onCancel }: AddPropertyFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'apartment' as Property['type'],
    purchasePrice: '',
    currentValue: '',
    monthlyRent: '',
    monthlyMortgage: '',
    interestRate: '6.5',
    loanTermYears: '30',
    downPaymentPercent: '20',
    expenses: '',
    squareFootage: '',
    bedrooms: '',
    bathrooms: '',
    yearBuilt: '',
    dateAcquired: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const property = {
      name: formData.name,
      address: formData.address,
      type: formData.type,
      purchasePrice: parseFloat(formData.purchasePrice),
      currentValue: parseFloat(formData.currentValue),
      monthlyRent: parseFloat(formData.monthlyRent),
      monthlyMortgage: parseFloat(formData.monthlyMortgage),
      interestRate: parseFloat(formData.interestRate),
      loanTermYears: parseInt(formData.loanTermYears),
      downPaymentPercent: parseFloat(formData.downPaymentPercent),
      expenses: parseFloat(formData.expenses),
      squareFootage: parseFloat(formData.squareFootage),
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
      yearBuilt: parseInt(formData.yearBuilt),
      dateAcquired: formData.dateAcquired
    };

    onAddProperty(property);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Home className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Add New Property</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Property Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Sunset Apartment Complex"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type">Property Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Full property address"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
            <Input
              id="purchasePrice"
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
              placeholder="350000"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="currentValue">Current Value ($)</Label>
            <Input
              id="currentValue"
              type="number"
              value={formData.currentValue}
              onChange={(e) => handleInputChange('currentValue', e.target.value)}
              placeholder="375000"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
            <Input
              id="monthlyRent"
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
              placeholder="2500"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="monthlyMortgage">Monthly Mortgage ($)</Label>
            <Input
              id="monthlyMortgage"
              type="number"
              value={formData.monthlyMortgage}
              onChange={(e) => handleInputChange('monthlyMortgage', e.target.value)}
              placeholder="1800"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="expenses">Monthly Expenses ($)</Label>
            <Input
              id="expenses"
              type="number"
              value={formData.expenses}
              onChange={(e) => handleInputChange('expenses', e.target.value)}
              placeholder="400"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={(e) => handleInputChange('interestRate', e.target.value)}
              placeholder="6.5"
              required
            />
          </div>

          <div>
            <Label htmlFor="loanTermYears">Loan Term (years)</Label>
            <Input
              id="loanTermYears"
              type="number"
              value={formData.loanTermYears}
              onChange={(e) => handleInputChange('loanTermYears', e.target.value)}
              placeholder="30"
              required
            />
          </div>

          <div>
            <Label htmlFor="downPaymentPercent">Down Payment (%)</Label>
            <Input
              id="downPaymentPercent"
              type="number"
              step="0.1"
              value={formData.downPaymentPercent}
              onChange={(e) => handleInputChange('downPaymentPercent', e.target.value)}
              placeholder="20"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="squareFootage">Square Footage</Label>
            <Input
              id="squareFootage"
              type="number"
              value={formData.squareFootage}
              onChange={(e) => handleInputChange('squareFootage', e.target.value)}
              placeholder="1200"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={(e) => handleInputChange('bedrooms', e.target.value)}
              placeholder="3"
            />
          </div>
          
          <div>
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              step="0.5"
              value={formData.bathrooms}
              onChange={(e) => handleInputChange('bathrooms', e.target.value)}
              placeholder="2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              type="number"
              value={formData.yearBuilt}
              onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
              placeholder="2015"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="dateAcquired">Date Acquired</Label>
            <Input
              id="dateAcquired"
              type="date"
              value={formData.dateAcquired}
              onChange={(e) => handleInputChange('dateAcquired', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};