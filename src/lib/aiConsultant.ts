import OpenAI from 'openai';
import { Property } from '@/types/property';
import { calculatePropertyMetrics, calculatePortfolioMetrics } from './propertyUtils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class PropertyAIConsultant {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  setApiKey(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
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
    if (!this.openai) {
      throw new Error('OpenAI API key not provided');
    }

    const propertyAnalysis = this.generatePropertyAnalysis(properties);
    
    const systemPrompt = `You are an expert real estate investment consultant and property management advisor. 

    Your role is to analyze property portfolios and provide actionable strategies to maximize profit and ROI.

    CURRENT PORTFOLIO DATA:
    ${propertyAnalysis}

    Guidelines for your responses:
    - Focus on practical, actionable advice
    - Consider market trends, cash flow optimization, and value appreciation
    - Suggest specific improvements like rent adjustments, property improvements, refinancing
    - Analyze underperforming properties and suggest solutions
    - Consider tax implications and investment strategies
    - Be concise but thorough in your recommendations
    - Use specific numbers from the portfolio data when relevant

    Always provide:
    1. Direct answer to the user's question
    2. Specific recommendations based on their portfolio
    3. Potential ROI impact of suggestions
    4. Next steps they should consider`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get AI consultation. Please check your API key and try again.');
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