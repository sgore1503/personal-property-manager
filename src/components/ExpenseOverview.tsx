import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, TrendingUp, Lightbulb, DollarSign, Calendar } from 'lucide-react';
import { Property } from "@/types/property";
import { calculateTaxBenefits } from "@/lib/propertyUtils";

interface ExpenseOverviewProps {
  properties: Property[];
}

export const ExpenseOverview = ({ properties }: ExpenseOverviewProps) => {
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
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