import { GoogleGenAI } from "@google/genai";
import { AggregatedMetrics } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generatePPCAnalysis = async (metrics: AggregatedMetrics, dateRangeLabel: string): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key not found. Please ensure the API_KEY environment variable is set.";
  }

  const prompt = `
    You are an expert Amazon PPC Analyst. Analyze the following performance data for the period: ${dateRangeLabel}.
    
    Metrics:
    - Spend: $${metrics.spend.toFixed(2)}
    - Sales (PPC): $${metrics.ppcSales.toFixed(2)}
    - Total Sales: $${metrics.totalSales.toFixed(2)}
    - ACoS: ${metrics.acos.toFixed(2)}%
    - TaCOS: ${metrics.tacos.toFixed(2)}%
    - CTR: ${metrics.ctr.toFixed(2)}%
    - Conversion Rate: ${metrics.cvr.toFixed(2)}%

    Provide 3 concise, actionable bullet points for optimization. Focus on budget efficiency and ACoS targets.
    Format as HTML list items <li> without the <ul> wrapper.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};
