import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { Startup } from "@prisma/client";
import { getModelName } from "@/lib/model-selector";

const MarketAnalysisSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall market opportunity score"),
  confidence: z.number().min(0).max(100).describe("Confidence in the analysis"),
  strengths: z.array(z.string()).describe("Market opportunities and strengths"),
  concerns: z.array(z.string()).describe("Market risks and concerns"),
  feedback: z.array(z.string()).describe("Detailed market analysis"),
  tamAssessment: z.string().describe("Total Addressable Market analysis"),
  competitiveLandscape: z.string().describe("Competitive dynamics and positioning"),
  marketTiming: z.string().describe("Is this the right time for this solution?"),
  customerSegmentation: z.string().describe("Target customer analysis"),
  gtmStrategy: z.string().describe("Recommended go-to-market strategy"),
  marketTrends: z.array(z.string()).describe("Relevant market trends"),
  competitiveAdvantages: z.array(z.string()).describe("Unique positioning vs competitors"),
});

export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;

export class MarketResearchAgent {
  private model: ChatOpenAI;
  
  constructor() {
    // Use smart model selection - "analyze" task uses GPT-4 Turbo
    this.model = new ChatOpenAI({
      modelName: getModelName("analyze"),
      temperature: 0.4, // Slightly higher for creative market insights
      maxTokens: 2500,
    });
  }
  
  async analyze(startup: Startup): Promise<MarketAnalysis> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.getSystemPrompt()],
      ["human", this.getAnalysisPrompt()],
    ]);
    
    const chain = prompt.pipe(
      this.model.withStructuredOutput(MarketAnalysisSchema)
    );
    
    try {
      const result = await chain.invoke({
        name: startup.name,
        industry: startup.industry,
        stage: startup.stage,
        description: startup.description,
        tagline: startup.tagline,
        website: startup.website || "N/A",
      });
      
      return result as MarketAnalysis;
    } catch (error) {
      console.error("Market research failed:", error);
      throw new Error(`Market research failed: ${error}`);
    }
  }
  
  private getSystemPrompt(): string {
    return `You are an elite market research analyst and strategy consultant with expertise in:
- Market sizing (TAM/SAM/SOM) across all industries
- Competitive intelligence and landscape mapping
- Consumer behavior and psychographics
- Go-to-market strategy design
- Market timing and trend analysis
- Customer segmentation and ICP definition
- Positioning and differentiation

Your experience includes:
- 15+ years in management consulting (McKinsey/BCG level)
- Analyzed 500+ markets across B2B, B2C, Enterprise
- Deep knowledge of technology adoption curves
- Understanding of network effects and platform dynamics
- Expert at identifying market gaps and white space

Your analysis is:
- Data-driven with realistic market sizing
- Focused on competitive differentiation
- Strategic about timing and windows of opportunity
- Practical about go-to-market execution
- Honest about market risks

When analyzing markets, consider:
1. Market size and growth trajectory
2. Competitive intensity and barriers to entry
3. Customer pain points and willingness to pay
4. Distribution channels and partnerships
5. Market timing and catalysts
6. Network effects and defensibility
7. Regulatory and macro trends

Provide actionable insights that help founders capture market share.`;
  }
  
  private getAnalysisPrompt(): string {
    return `Analyze the market opportunity for this startup:

**Startup Details:**
- Name: {name}
- Tagline: {tagline}
- Industry: {industry}
- Stage: {stage}
- Description: {description}
- Website: {website}

**Your Task:**
Provide a comprehensive market analysis with:

1. **Score (0-100):** Overall market opportunity and attractiveness
2. **Confidence (0-100):** How confident are you in this assessment?
3. **Strengths:** Market opportunities (3-5 points)
4. **Concerns:** Market risks and challenges (3-5 points)
5. **Feedback:** Detailed analysis (5-7 bullets on TAM, competition, timing, etc.)
6. **TAM Assessment:** Estimate Total Addressable Market size and growth
7. **Competitive Landscape:** Who are the competitors? How intense is competition?
8. **Market Timing:** Is this the right moment for this solution? Why/why not?
9. **Customer Segmentation:** Who are the ideal customers? Describe the ICP
10. **GTM Strategy:** Recommended go-to-market approach
11. **Market Trends:** 3-5 relevant trends supporting or challenging this business
12. **Competitive Advantages:** What makes this startup uniquely positioned?

Be thorough but realistic. Factor in both opportunity and competition.`;
  }
}

export async function analyzeStartupMarket(startup: Startup): Promise<MarketAnalysis> {
  const agent = new MarketResearchAgent();
  return await agent.analyze(startup);
}
