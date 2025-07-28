import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Receipt, Clock, TrendingUp } from 'lucide-react';
import { Property, ExpenseRecord, TimeRecord } from "@/types/property";
import { calculateTaxBenefits } from "@/lib/propertyUtils";

interface ExpenseTrackerProps {
  property: Property;
  onUpdateProperty: (property: Property) => void;
}

export const ExpenseTracker = ({ property, onUpdateProperty }: ExpenseTrackerProps) => {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    description: '',
    isDeductible: true
  });
  const [timeForm, setTimeForm] = useState({
    hours: '',
    activity: '',
    hourlyRate: ''
  });

  const taxBenefits = calculateTaxBenefits(property);

  const addExpense = () => {
    if (!expenseForm.category || !expenseForm.amount) return;

    const newExpense: ExpenseRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      category: expenseForm.category as ExpenseRecord['category'],
      amount: parseFloat(expenseForm.amount),
      description: expenseForm.description,
      isDeductible: expenseForm.isDeductible
    };

    onUpdateProperty({
      ...property,
      expenseTracking: [...property.expenseTracking, newExpense]
    });

    setExpenseForm({ category: '', amount: '', description: '', isDeductible: true });
    setShowExpenseForm(false);
  };

  const addTime = () => {
    if (!timeForm.hours || !timeForm.activity) return;

    const newTime: TimeRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      hours: parseFloat(timeForm.hours),
      activity: timeForm.activity,
      hourlyRate: timeForm.hourlyRate ? parseFloat(timeForm.hourlyRate) : undefined
    };

    onUpdateProperty({
      ...property,
      timeTracking: [...property.timeTracking, newTime]
    });

    setTimeForm({ hours: '', activity: '', hourlyRate: '' });
    setShowTimeForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Tax Benefits Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tax Benefits Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${taxBenefits.estimatedTaxSavings.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Est. Tax Savings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                ${taxBenefits.annualDeductions.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Annual Deductions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                ${taxBenefits.depreciationDeduction.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Depreciation</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                ${taxBenefits.totalDeductibleExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Tracked Expenses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expense Tracking
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
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
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
              <div className="flex items-center space-x-2">
                <Switch
                  checked={expenseForm.isDeductible}
                  onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, isDeductible: checked }))}
                />
                <Label>Tax Deductible</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={addExpense}>Add Expense</Button>
                <Button variant="outline" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {property.expenseTracking.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{expense.category}</p>
                  <p className="text-sm text-muted-foreground">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{expense.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${expense.amount.toLocaleString()}</p>
                  {expense.isDeductible && (
                    <p className="text-xs text-green-600">Tax Deductible</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
          <Button onClick={() => setShowTimeForm(true)} size="sm">
            <Plus className="h-4 w-4" />
            Add Time
          </Button>
        </CardHeader>
        <CardContent>
          {showTimeForm && (
            <div className="mb-4 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="0.0"
                    value={timeForm.hours}
                    onChange={(e) => setTimeForm(prev => ({ ...prev, hours: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Hourly Rate (optional)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={timeForm.hourlyRate}
                    onChange={(e) => setTimeForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Activity</Label>
                <Input
                  placeholder="What did you work on?"
                  value={timeForm.activity}
                  onChange={(e) => setTimeForm(prev => ({ ...prev, activity: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addTime}>Add Time</Button>
                <Button variant="outline" onClick={() => setShowTimeForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {property.timeTracking.map((time) => (
              <div key={time.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{time.activity}</p>
                  <p className="text-xs text-muted-foreground">{time.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{time.hours}h</p>
                  {time.hourlyRate && (
                    <p className="text-sm text-muted-foreground">
                      ${(time.hours * time.hourlyRate).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};