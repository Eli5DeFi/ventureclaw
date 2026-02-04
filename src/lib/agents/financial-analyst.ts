import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { Startup } from "@prisma/client";
import { getModelName } from "@/lib/model-selector";

// Output schema for structured data
const FinancialAnalysisSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall financial score"),
  confidence: z.number().min(0).max(100).describe("Confidence in the analysis"),
  strengths: z.array(z.string()).describe("Key financial strengths"),
  concerns: z.array(z.string()).describe("Financial concerns or risks"),
  feedback: z.array(z.string()).describe("Detailed feedback points"),
  valuation: z.number().describe("Estimated valuation in USD"),
  valuationMethodology: z.string().describe("How the valuation was calculated"),
  burnRateAssessment: z.string().describe("Assessment of burn rate and runway"),
  revenueModelAnalysis: z.string().describe("Analysis of revenue model viability"),
  fundingRecommendation: z.string().describe("Specific funding recommendation"),
});

export type FinancialAnalysis = z.infer<typeof FinancialAnalysisSchema>;

export class FinancialAnalystAgent {
  private model: ChatOpenAI;
  
  constructor() {
    // Use smart model selection - "analyze" task uses GPT-4 Turbo
    this.model = new ChatOpenAI({
      modelName: getModelName("analyze"),
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 2000,
    });
  }
  
  async analyze(startup: Startup): Promise<FinancialAnalysis> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.getSystemPrompt()],
      ["human", this.getAnalysisPrompt()],
    ]);
    
    const chain = prompt.pipe(
      this.model.withStructuredOutput(FinancialAnalysisSchema)
    );
    
    try {
      const result = await chain.invoke({
        name: startup.name,
        industry: startup.industry,
        stage: startup.stage,
        description: startup.description,
        fundingAsk: startup.fundingAsk,
        teamSize: startup.teamSize,
        website: startup.website || "N/A",
        tagline: startup.tagline,
      });
      
      return result as FinancialAnalysis;
    } catch (error) {
      console.error("Financial analysis failed:", error);
      throw new Error(`Financial analysis failed: ${error}`);
    }
  }
  
  private getSystemPrompt(): string {
    return `You are an elite financial analyst specializing in startup evaluation. Your expertise includes:
- Venture capital fund management ($500M+ AUM)
- 200+ successful startup investments
- Deep knowledge of revenue models across all industries
- Expert at financial modeling and valuation
- Understanding of burn rates, unit economics, and growth metrics

Your analysis is:
- Data-driven and quantitative where possible
- Honest and unbiased
- Contextual to the startup's stage and industry
- Focused on identifying both opportunities and risks
- Calibrated to provide accurate confidence scores

When analyzing, consider:
1. Revenue model sustainability and scalability
2. Capital efficiency and burn rate
3. Unit economics and gross margins
4. Market size and monetization potential
5. Competitive dynamics affecting pricing power
6. Financial risks and mitigation strategies
7. Alignment of funding ask with business needs

Provide specific, actionable insights that help both founders and investors make informed decisions.`;
  }
  
  private getAnalysisPrompt(): string {
    return `Analyze this startup's financial viability:

**Startup Details:**
- Name: {name}
- Tagline: {tagline}
- Industry: {industry}
- Stage: {stage}
- Description: {description}
- Funding Ask: ${"{fundingAsk}"}
- Team Size: {teamSize}
- Website: {website}

**Your Task:**
Provide a comprehensive financial analysis with:

1. **Score (0-100):** Overall financial attractiveness
2. **Confidence (0-100):** How confident are you in this assessment?
3. **Strengths:** What are the key financial strengths? (3-5 points)
4. **Concerns:** What are the main financial risks? (3-5 points)
5. **Feedback:** Detailed analysis (5-7 bullet points covering revenue model, burn rate, unit economics, etc.)
6. **Valuation:** Estimated pre-money valuation (in USD)
7. **Methodology:** Explain how you arrived at this valuation
8. **Burn Rate Assessment:** Analyze expected burn and runway
9. **Revenue Model Analysis:** Evaluate monetization strategy
10. **Funding Recommendation:** Specific advice on the funding ask

Be thorough but concise. Focus on what matters most for this stage and industry.`;
  }
}

// Helper function to use in API routes
export async function analyzeStartupFinancials(startup: Startup): Promise<FinancialAnalysis> {
  const agent = new FinancialAnalystAgent();
  return await agent.analyze(startup);
}
