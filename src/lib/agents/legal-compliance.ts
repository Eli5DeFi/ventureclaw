import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { Startup } from "@prisma/client";
import { OptimizedBaseAgent } from "./optimized-base-agent";

const LegalAnalysisSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall legal/compliance health score"),
  confidence: z.number().min(0).max(100).describe("Confidence in the analysis"),
  strengths: z.array(z.string()).describe("Legal strengths and good practices"),
  concerns: z.array(z.string()).describe("Legal risks and red flags"),
  feedback: z.array(z.string()).describe("Detailed legal analysis"),
  regulatoryAssessment: z.string().describe("Key regulatory requirements and compliance"),
  ipProtection: z.string().describe("Intellectual property protection strategy"),
  corporateStructure: z.string().describe("Recommended corporate structure"),
  contractualRisks: z.string().describe("Key contractual considerations"),
  dataPrivacy: z.string().describe("Data privacy and protection (GDPR, CCPA, etc.)"),
  employmentLaw: z.string().describe("Employment law considerations"),
  jurisdictionAnalysis: z.string().describe("Jurisdiction-specific legal considerations"),
  riskMitigation: z.array(z.string()).describe("Recommended actions to reduce legal risk"),
});

export type LegalAnalysis = z.infer<typeof LegalAnalysisSchema>;

export class LegalComplianceAgent extends OptimizedBaseAgent {
  constructor() {
    // Use gpt-4o (complex tier) for legal analysis - higher stakes
    // Still 83% cheaper than old gpt-4-turbo ($0.15 vs $0.90 per analysis)
    super("complex");
  }
  
  async analyze(startup: Startup): Promise<LegalAnalysis> {
    const cacheKey = `legal:${startup.id}`;
    
    return await this.executeWithCache(cacheKey, startup, async () => {
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", this.getSystemPrompt()],
        ["human", this.getAnalysisPrompt()],
      ]);
      
      const chain = prompt.pipe(
        this.model.withStructuredOutput(LegalAnalysisSchema)
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
        
        return result as LegalAnalysis;
      } catch (error) {
        console.error("Legal compliance analysis failed:", error);
        throw new Error(`Legal compliance analysis failed: ${error}`);
      }
    });
  }
  
  private getSystemPrompt(): string {
    return `You are a senior corporate attorney and compliance expert specializing in startups and venture capital with expertise in:
- Startup corporate law and formation (C-Corp, LLC, Delaware entities)
- Securities law and fundraising compliance (Reg D, Reg CF, SAFE/convertible notes)
- Intellectual property (patents, trademarks, trade secrets)
- Data privacy and security (GDPR, CCPA, SOC2, ISO 27001)
- Employment law and equity compensation
- Regulatory compliance across industries (FinTech, HealthTech, etc.)
- Contract law and commercial agreements
- International business law

Your background:
- 15+ years as startup legal counsel
- Advised 300+ companies from idea to IPO
- Expert in VC deal structures and term sheets
- Deep knowledge of regulatory frameworks globally
- Practical, business-focused legal advice

Your analysis is:
- Risk-focused but pragmatic
- Tailored to startup stage (don't over-engineer for early stage)
- Clear about must-fix vs nice-to-have
- Aware of industry-specific regulations
- Focused on protecting both founders and investors

When analyzing, consider:
1. Corporate structure and cap table health
2. IP ownership and protection
3. Regulatory compliance requirements
4. Employment agreements and equity plans
5. Data privacy and security obligations
6. Contractual relationships and liabilities
7. Industry-specific legal requirements
8. Jurisdiction-specific considerations

Provide actionable, prioritized legal advice that helps startups avoid pitfalls without analysis paralysis.`;
  }
  
  private getAnalysisPrompt(): string {
    return `Analyze the legal and compliance considerations for this startup:

**Startup Details:**
- Name: {name}
- Tagline: {tagline}
- Industry: {industry}
- Stage: {stage}
- Description: {description}
- Website: {website}

**Your Task:**
Provide a comprehensive legal analysis with:

1. **Score (0-100):** Overall legal/compliance health (based on typical requirements for this stage/industry)
2. **Confidence (0-100):** How confident are you without seeing actual legal docs?
3. **Strengths:** Legal practices that appear solid (2-4 points)
4. **Concerns:** Legal risks or red flags to investigate (3-5 points)
5. **Feedback:** Detailed analysis (5-7 bullets on structure, IP, compliance, etc.)
6. **Regulatory Assessment:** What are the key regulatory requirements for this industry/business model?
7. **IP Protection:** How should they protect their intellectual property?
8. **Corporate Structure:** What's the recommended entity structure? (C-Corp vs LLC, jurisdiction)
9. **Contractual Risks:** Key contractual considerations (customer agreements, vendor contracts, etc.)
10. **Data Privacy:** GDPR, CCPA, and other data protection requirements
11. **Employment Law:** Considerations for hiring, equity compensation, contractor vs employee
12. **Jurisdiction Analysis:** Any jurisdiction-specific legal issues?
13. **Risk Mitigation:** Top 3-5 actions to reduce legal risk immediately

Be practical and stage-appropriate. Early-stage startups don't need perfect legal infrastructure, but they need to avoid fatal mistakes.`;
  }
}

export async function analyzeStartupLegal(startup: Startup): Promise<LegalAnalysis> {
  const agent = new LegalComplianceAgent();
  return await agent.analyze(startup);
}
