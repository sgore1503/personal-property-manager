import { Property } from '@/types/property';
import { calculatePropertyMetrics, calculatePortfolioMetrics } from './propertyUtils';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class PropertyAIConsultant {
  constructor() {
    // No need to store API key in the client anymore
  }

  setApiKey(apiKey: string) {
    // API key is now handled securely by Supabase edge function
  }

  private generatePropertyAnalysis(properties: Property[]): string {
    const portfolioMetrics = calculatePortfolioMetrics(properties);
    
    let analysis = `PORTFOLIO OVERVIEW:\n`;
    analysis += `- Total Properties: ${portfolioMetrics.propertyCount}\n`;
    analysis += `- Portfolio Value: $${portfolioMetrics.totalValue.toLocaleString()}\n`;
    analysis += `- Monthly Cash Flow: $${portfolioMetrics.totalCashFlow.toLocaleString()}\n`;
    analysis += `- Average Cap Rate: ${portfolioMetrics.averageCapRate.toFixed(1)}%\n\n`;

    analysis += `INDIVIDUAL PROPERTIES:\n`;
    properties.forEach((property, index) => {
      const metrics = calculatePropertyMetrics(property);
      analysis += `${index + 1}. ${property.name}\n`;
      analysis += `   - Type: ${property.type}\n`;
      analysis += `   - Current Value: $${property.currentValue.toLocaleString()}\n`;
      analysis += `   - Monthly Rent: $${property.monthlyRent.toLocaleString()}\n`;
      analysis += `   - Monthly Cash Flow: $${metrics.cashFlow.toLocaleString()}\n`;
      analysis += `   - Cap Rate: ${metrics.capRate.toFixed(1)}%\n`;
      analysis += `   - Annual Return: ${metrics.annualReturn.toFixed(1)}%\n\n`;
    });

    return analysis;
  }

  async getConsultation(message: string, properties: Property[]): Promise<string> {
    const propertyAnalysis = this.generatePropertyAnalysis(properties);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-property-consultant', {
        body: {
          message,
          portfolioAnalysis: propertyAnalysis
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Failed to get AI consultation. Please try again.');
      }

      if (!data?.content) {
        throw new Error('No response received from AI consultant.');
      }

      return data.content;
    } catch (error) {
      console.error('AI consultation error:', error);
      throw new Error('Failed to get AI consultation. Please try again.');
    }
  }

  async getSuggestedQuestions(properties: Property[]): Promise<string[]> {
    const portfolioMetrics = calculatePortfolioMetrics(properties);
    const lowPerformingProperties = properties.filter(p => {
      const metrics = calculatePropertyMetrics(p);
      return metrics.capRate < 6 || metrics.cashFlow < 200;
    });

    const suggestions = [
      'How can I improve the cash flow of my underperforming properties?',
      'What rent adjustments should I consider for maximum profitability?',
      'Should I refinance any of my properties given current market rates?',
      'Which property improvements would give me the best ROI?',
      'How can I optimize my property portfolio for better tax benefits?'
    ];

    // Add specific suggestions based on portfolio
    if (portfolioMetrics.totalCashFlow < 0) {
      suggestions.unshift('My portfolio has negative cash flow. What immediate steps should I take?');
    }

    if (lowPerformingProperties.length > 0) {
      suggestions.unshift(`I have ${lowPerformingProperties.length} underperforming properties. What should I do?`);
    }

    if (portfolioMetrics.averageCapRate < 5) {
      suggestions.unshift('My average cap rate is low. How can I improve it?');
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}