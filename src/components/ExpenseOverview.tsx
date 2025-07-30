import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Receipt, TrendingUp, Lightbulb, DollarSign, Calendar, Plus } from 'lucide-react';
import { Property, ExpenseRecord } from "@/types/property";
import { calculateTaxBenefits } from "@/lib/propertyUtils";
import { useToast } from "@/hooks/use-toast";

interface ExpenseOverviewProps {
  properties: Property[];
  onUpdateProperty: (property: Property) => void;
}

export const ExpenseOverview = ({ properties, onUpdateProperty }: ExpenseOverviewProps) => {
  const { toast } = useToast();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    propertyId: '',
    category: '',
    amount: '',
    description: '',
    isDeductible: true
  });
  // Calculate total expenses across all properties
  const allExpenses = properties.flatMap(property => 
    property.expenseTracking.map(expense => ({
      ...expense,
      propertyAddress: property.address
    }))
  );

  // Sort expenses by date (most recent first)
  const sortedExpenses = allExpenses.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate total amounts
  const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalDeductibleExpenses = allExpenses
    .filter(expense => expense.isDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate total tax benefits across all properties
  const totalTaxBenefits = properties.reduce((total, property) => {
    const benefits = calculateTaxBenefits(property);
    return {
      estimatedTaxSavings: total.estimatedTaxSavings + benefits.estimatedTaxSavings,
      annualDeductions: total.annualDeductions + benefits.annualDeductions,
      depreciationDeduction: total.depreciationDeduction + benefits.depreciationDeduction
    };
  }, { estimatedTaxSavings: 0, annualDeductions: 0, depreciationDeduction: 0 });

  // Tax suggestions
  const taxSuggestions = [
    {
      title: "Track Mileage",
      description: "Don't forget to track mileage for property visits. The IRS allows $0.655 per mile for 2023.",
      category: "Deduction"
    },
    {
      title: "Home Office Deduction",
      description: "If you use part of your home exclusively for property management, you may qualify for a home office deduction.",
      category: "Deduction"
    },
    {
      title: "Professional Services",
      description: "Legal, accounting, and property management fees are fully deductible business expenses.",
      category: "Deduction"
    },
    {
      title: "Section 199A Deduction",
      description: "You may qualify for up to 20% deduction on qualified business income from rental properties.",
      category: "Tax Strategy"
    },
    {
      title: "1031 Exchange",
      description: "Consider a 1031 exchange to defer capital gains taxes when selling investment properties.",
      category: "Tax Strategy"
    },
    {
      title: "Depreciation Recapture",
      description: "Plan for depreciation recapture taxes when considering property sales.",
      category: "Planning"
    }
  ];

  const addExpense = () => {
    if (!expenseForm.propertyId || !expenseForm.category || !expenseForm.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const property = properties.find(p => p.id === expenseForm.propertyId);
    if (!property) return;

    const newExpense: ExpenseRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      category: expenseForm.category as ExpenseRecord['category'],
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description,
      isDeductible: expenseForm.isDeductible
    };

    const updatedProperty = {
      ...property,
      expenseTracking: [...property.expenseTracking, newExpense]
    };

    onUpdateProperty(updatedProperty);

    setExpenseForm({ propertyId: '', category: '', amount: '', description: '', isDeductible: true });
    setShowExpenseForm(false);
    
    toast({
      title: "Success",
      description: "Expense added successfully"
    });
  };

  return (
    <div className="space-y-6">
      {/* Tax Benefits Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Tax Benefits Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                ${totalTaxBenefits.estimatedTaxSavings.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Est. Tax Savings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                ${totalTaxBenefits.annualDeductions.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Annual Deductions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                ${totalTaxBenefits.depreciationDeduction.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Depreciation</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                ${totalDeductibleExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Deductible Expenses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{allExpenses.length}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Expenses
          </CardTitle>
          <Button onClick={() => setShowExpenseForm(true)} size="sm">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {showExpenseForm && (
            <div className="mb-4 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Property</Label>
                  <Select value={expenseForm.propertyId} onValueChange={(value) => 
                    setExpenseForm(prev => ({ ...prev, propertyId: value }))
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
                  <Label>Category</Label>
                  <Select value={expenseForm.category} onValueChange={(value) => 
                    setExpenseForm(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="taxes">Taxes</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={expenseForm.isDeductible}
                    onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, isDeductible: checked }))}
                  />
                  <Label>Tax Deductible</Label>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the expense..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addExpense}>Add Expense</Button>
                <Button variant="outline" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sortedExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses tracked yet. Add properties and start tracking expenses to see them here.
              </div>
            ) : (
              sortedExpenses.slice(0, 20).map((expense) => (
                <div key={`${expense.id}-${expense.propertyAddress}`} className="flex justify-between items-start p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium capitalize">{expense.category}</p>
                      {expense.isDeductible && (
                        <Badge variant="secondary" className="text-xs">Tax Deductible</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">{expense.propertyAddress}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      <p className="text-xs text-muted-foreground">{expense.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${expense.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Tips & Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Tax Tips & Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {taxSuggestions.map((suggestion, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};