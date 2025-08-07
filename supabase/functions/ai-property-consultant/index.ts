import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { message, portfolioAnalysis } = await req.json();

    if (!message || !portfolioAnalysis) {
      throw new Error('Message and portfolio analysis are required');
    }

    const systemPrompt = `You are an expert real estate investment consultant and property management advisor. 

Your role is to analyze property portfolios and provide actionable strategies to maximize profit and ROI.

CURRENT PORTFOLIO DATA:
${portfolioAnalysis}

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

    console.log('Making request to OpenAI with message:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');

    const generatedContent = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-property-consultant function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});