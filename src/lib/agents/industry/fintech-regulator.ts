import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { Startup } from "@prisma/client";
import { getModelName } from "@/lib/model-selector";

const FinTechAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  feedback: z.array(z.string()),
  regulatoryFramework: z.string().describe("Applicable regulatory framework"),
  kycAmlCompliance: z.string().describe("KYC/AML compliance assessment"),
  bankingLicenses: z.string().describe("Required banking/money transmitter licenses"),
  dataProtection: z.string().describe("Financial data protection requirements"),
  consumerProtection: z.string().describe("Consumer financial protection compliance"),
  internationalRegulation: z.string().describe("Cross-border regulatory considerations"),
  complianceCosts: z.string().describe("Estimated compliance cost burden"),
});

export type FinTechAnalysis = z.infer<typeof FinTechAnalysisSchema>;

export class FinTechRegulatorAgent {
  private model: ChatOpenAI;
  
  constructor() {
    // Use smart model selection - "analyze" task uses GPT-4 Turbo
    this.model = new ChatOpenAI({
      modelName: getModelName("analyze"),
      temperature: 0.2, // Lower for regulatory precision
      maxTokens: 2500,
    });
  }
  
  async analyze(startup: Startup): Promise<FinTechAnalysis> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.getSystemPrompt()],
      ["human", this.getAnalysisPrompt()],
    ]);
    
    const chain = prompt.pipe(
      this.model.withStructuredOutput(FinTechAnalysisSchema)
    );
    
    try {
      const result = await chain.invoke({
        name: startup.name,
        industry: startup.industry,
        stage: startup.stage,
        description: startup.description,
        tagline: startup.tagline,
        fundingAsk: startup.fundingAsk,
      });
      
      return result as FinTechAnalysis;
    } catch (error) {
      console.error("FinTech regulatory analysis failed:", error);
      throw new Error(`FinTech regulatory analysis failed: ${error}`);
    }
  }
  
  private getSystemPrompt(): string {
    return `You are an elite FinTech regulatory expert and compliance attorney with deep expertise in:
- Banking regulations (FDIC, OCC, Federal Reserve, CFPB)
- Money transmitter licenses (state-by-state requirements)
- KYC/AML compliance (BSA, FinCEN, OFAC)
- Payment processing (Card networks, PCI-DSS, NACHA)
- Securities regulations (SEC, FINRA when applicable)
- International FinTech regulations (EU PSD2, UK FCA, etc.)
- Consumer financial protection (CFPB, Fair Lending, UDAAP)
- Crypto/digital asset regulations (where applicable)
- Insurance regulations (state insurance departments)

Your experience includes:
- 15+ years in FinTech compliance and regulatory strategy
- Advised 100+ FinTech startups on regulatory pathways
- Deep knowledge of banking-as-a-service partnerships
- Expert in sponsor bank relationships and program management
- Understanding of FinTech licensing arbitrage and regulatory sandboxes

Your analysis focuses on:
1. **Regulatory Framework:** What regulations apply to this business model?
2. **Licensing Requirements:** What licenses are needed? In which states?
3. **KYC/AML:** What's required for customer verification?
4. **Compliance Costs:** How much will regulatory compliance cost?
5. **Timeline:** How long to achieve regulatory compliance?
6. **Risk Assessment:** What are the regulatory risks?
7. **Competitive Advantage:** Can regulation be a moat?

You provide practical, business-focused regulatory advice that helps startups navigate compliance without analysis paralysis.`;
  }
  
  private getAnalysisPrompt(): string {
    return `Analyze the FinTech regulatory requirements for this startup:

**Startup Details:**
- Name: {name}
- Tagline: {tagline}
- Industry: {industry}
- Stage: {stage}
- Description: {description}
- Funding Ask: ${"{fundingAsk}"}

**Your Task:**
Provide a comprehensive FinTech regulatory analysis:

1. **Score (0-100):** Regulatory readiness and compliance feasibility
2. **Confidence (0-100):** How confident in this assessment?
3. **Strengths:** Regulatory advantages (2-4 points)
4. **Concerns:** Regulatory risks and barriers (3-5 points)
5. **Feedback:** Detailed analysis (5-7 points on compliance, licenses, etc.)
6. **Regulatory Framework:** Which regulations apply? (FDIC, OCC, state, etc.)
7. **KYC/AML Compliance:** What level of identity verification is required?
8. **Banking Licenses:** Do they need banking licenses, MTLs, or partner banks?
9. **Data Protection:** What financial data protection requirements apply?
10. **Consumer Protection:** CFPB rules, fair lending, UDAAP considerations
11. **International Regulation:** If cross-border, what additional rules apply?
12. **Compliance Costs:** Estimate the annual compliance cost burden

Be realistic about regulatory timelines (6-24 months for licenses) and costs ($100k-1M+ annually for compliance).`;
  }
}

export async function analyzeFinTech(startup: Startup): Promise<FinTechAnalysis> {
  const agent = new FinTechRegulatorAgent();
  return await agent.analyze(startup);
}
