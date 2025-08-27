import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar, CreditCard, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { Property, BillRecord } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

interface BillTrackerProps {
  properties: Property[];
  onUpdateProperty: (property: Property) => void;
}

export const BillTracker = ({ properties, onUpdateProperty }: BillTrackerProps) => {
  const { toast } = useToast();
  const [showBillForm, setShowBillForm] = useState(false);
  const [billForm, setBillForm] = useState({
    propertyId: '',
    name: '',
    category: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    notes: '',
    autoPayEnabled: false
  });

  // Get all bills across properties
  const allBills = properties.flatMap(property => 
    property.billTracking.map(bill => ({
      ...bill,
      propertyId: property.id,
      propertyAddress: property.address
    }))
  );

  // Sort bills by due date
  const sortedBills = allBills.sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Get upcoming bills (next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingBills = sortedBills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return dueDate >= today && dueDate <= thirtyDaysFromNow && !bill.isPaid;
  });

  // Get overdue bills
  const overdueBills = sortedBills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return dueDate < today && !bill.isPaid;
  });

  const addBill = () => {
    if (!billForm.propertyId || !billForm.name || !billForm.category || !billForm.amount || !billForm.dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const property = properties.find(p => p.id === billForm.propertyId);
    if (!property) return;

    const newBill: BillRecord = {
      id: Date.now().toString(),
      name: billForm.name,
      category: billForm.category as BillRecord['category'],
      amount: parseFloat(billForm.amount),
      dueDate: billForm.dueDate,
      frequency: billForm.frequency as BillRecord['frequency'],
      isPaid: false,
      notes: billForm.notes,
      autoPayEnabled: billForm.autoPayEnabled
    };

    const updatedProperty = {
      ...property,
      billTracking: [...property.billTracking, newBill]
    };

    onUpdateProperty(updatedProperty);

    setBillForm({
      propertyId: '',
      name: '',
      category: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      notes: '',
      autoPayEnabled: false
    });
    setShowBillForm(false);
    
    toast({
      title: "Success",
      description: "Bill added successfully"
    });
  };

  const markAsPaid = (billId: string, propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    const updatedBills = property.billTracking.map(bill =>
      bill.id === billId 
        ? { ...bill, isPaid: true, lastPaidDate: new Date().toISOString().split('T')[0] }
        : bill
    );

    const updatedProperty = {
      ...property,
      billTracking: updatedBills
    };

    onUpdateProperty(updatedProperty);
    
    toast({
      title: "Success",
      description: "Bill marked as paid"
    });
  };

  const getBillStatusColor = (bill: any) => {
    if (bill.isPaid) return 'bg-green-500';
    if (overdueBills.some(overdue => overdue.id === bill.id)) return 'bg-red-500';
    if (upcomingBills.some(upcoming => upcoming.id === bill.id)) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Bill Tracker
        </CardTitle>
        <Button onClick={() => setShowBillForm(true)} size="sm">
          <Plus className="h-4 w-4" />
          Add Bill
        </Button>
      </CardHeader>
      <CardContent>
        {/* Bill Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-2xl font-bold text-red-600">{overdueBills.length}</p>
            </div>
            <p className="text-sm text-red-700">Overdue Bills</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">{upcomingBills.length}</p>
            </div>
            <p className="text-sm text-yellow-700">Due Soon</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold text-green-600">
                {allBills.filter(bill => bill.isPaid).length}
              </p>
            </div>
            <p className="text-sm text-green-700">Paid This Month</p>
          </div>
        </div>

        {/* Add Bill Form */}
        {showBillForm && (
          <div className="mb-6 p-4 border rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property</Label>
                <Select value={billForm.propertyId} onValueChange={(value) => 
                  setBillForm(prev => ({ ...prev, propertyId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bill Name</Label>
                <Input
                  placeholder="e.g., Electric Bill"
                  value={billForm.name}
                  onChange={(e) => setBillForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={billForm.category} onValueChange={(value) => 
                  setBillForm(prev => ({ ...prev, category: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="taxes">Taxes</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={billForm.amount}
                  onChange={(e) => setBillForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select value={billForm.frequency} onValueChange={(value) => 
                  setBillForm(prev => ({ ...prev, frequency: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  checked={billForm.autoPayEnabled}
                  onCheckedChange={(checked) => setBillForm(prev => ({ ...prev, autoPayEnabled: checked }))}
                />
                <Label>Auto Pay Enabled</Label>
              </div>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this bill..."
                value={billForm.notes}
                onChange={(e) => setBillForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addBill}>Add Bill</Button>
              <Button variant="outline" onClick={() => setShowBillForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Bills List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bills tracked yet. Add bills to keep track of payment due dates.
            </div>
          ) : (
            sortedBills.map((bill) => (
              <div key={`${bill.id}-${bill.propertyId}`} className="flex justify-between items-start p-3 border rounded-lg">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getBillStatusColor(bill)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{bill.name}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {bill.category}
                      </Badge>
                      {bill.autoPayEnabled && (
                        <Badge variant="secondary" className="text-xs">Auto Pay</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Due: {formatDate(bill.dueDate)} • {bill.frequency}
                    </p>
                    <p className="text-xs text-muted-foreground">{bill.propertyAddress}</p>
                    {bill.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{bill.notes}</p>
                    )}
                    {bill.lastPaidDate && (
                      <p className="text-xs text-green-600 mt-1">
                        Last paid: {formatDate(bill.lastPaidDate)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="font-bold text-lg">${bill.amount.toLocaleString()}</p>
                  {!bill.isPaid && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markAsPaid(bill.id, bill.propertyId)}
                    >
                      Mark Paid
                    </Button>
                  )}
                  {bill.isPaid && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};