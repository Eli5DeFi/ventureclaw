import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { Startup } from "@prisma/client";
import { getModelName } from "@/lib/model-selector";

const TechnicalAnalysisSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall technical score"),
  confidence: z.number().min(0).max(100).describe("Confidence in the analysis"),
  strengths: z.array(z.string()).describe("Key technical strengths"),
  concerns: z.array(z.string()).describe("Technical concerns or risks"),
  feedback: z.array(z.string()).describe("Detailed technical feedback"),
  scalabilityAssessment: z.string().describe("Can the tech scale to millions of users?"),
  securityAssessment: z.string().describe("Security and data protection evaluation"),
  ipAssessment: z.string().describe("Intellectual property and defensibility"),
  techStackModernity: z.string().describe("Is the tech stack current and appropriate?"),
  teamCapabilityAssessment: z.string().describe("Does the team have the technical chops?"),
  technicalRisks: z.array(z.string()).describe("Specific technical risks to monitor"),
});

export type TechnicalAnalysis = z.infer<typeof TechnicalAnalysisSchema>;

export class TechnicalDDAgent {
  private model: ChatOpenAI;
  
  constructor() {
    // Use smart model selection - "analyze" task uses GPT-4 Turbo
    this.model = new ChatOpenAI({
      modelName: getModelName("analyze"),
      temperature: 0.3,
      maxTokens: 2000,
    });
  }
  
  async analyze(startup: Startup): Promise<TechnicalAnalysis> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.getSystemPrompt()],
      ["human", this.getAnalysisPrompt()],
    ]);
    
    const chain = prompt.pipe(
      this.model.withStructuredOutput(TechnicalAnalysisSchema)
    );
    
    try {
      const result = await chain.invoke({
        name: startup.name,
        industry: startup.industry,
        stage: startup.stage,
        description: startup.description,
        teamSize: startup.teamSize,
        website: startup.website || "N/A",
        tagline: startup.tagline,
      });
      
      return result as TechnicalAnalysis;
    } catch (error) {
      console.error("Technical DD failed:", error);
      throw new Error(`Technical DD failed: ${error}`);
    }
  }
  
  private getSystemPrompt(): string {
    return `You are a senior technical due diligence expert with deep expertise in:
- Software architecture and system design (15+ years)
- Scalability and performance engineering
- Security and data protection (GDPR, SOC2, PCI compliance)
- Cloud infrastructure (AWS, GCP, Azure)
- Modern tech stacks across web, mobile, AI/ML, blockchain
- Intellectual property and patent evaluation
- Technical team assessment and hiring

Your analysis focuses on:
1. **Scalability:** Can this handle 10M+ users?
2. **Security:** Is data protected? Are there vulnerabilities?
3. **Tech Stack:** Modern, maintainable, appropriate for the problem?
4. **IP/Defensibility:** Any proprietary tech or moats?
5. **Team Capability:** Can they execute the technical vision?
6. **Technical Debt:** Are they building for the long term?
7. **Infrastructure Cost:** Will cloud costs scale linearly or exponentially?

You provide honest, practical assessments that help identify technical risks early.`;
  }
  
  private getAnalysisPrompt(): string {
    return `Evaluate the technical viability of this startup:

**Startup Details:**
- Name: {name}
- Tagline: {tagline}
- Industry: {industry}
- Stage: {stage}
- Description: {description}
- Team Size: {teamSize}
- Website: {website}

**Your Task:**
Provide a thorough technical assessment covering:

1. **Score (0-100):** Overall technical quality and viability
2. **Confidence (0-100):** How confident are you without seeing the code?
3. **Strengths:** Technical advantages (3-5 points)
4. **Concerns:** Technical risks or red flags (3-5 points)
5. **Feedback:** Detailed analysis (5-7 points on architecture, stack, etc.)
6. **Scalability Assessment:** Can it scale? What are the bottlenecks?
7. **Security Assessment:** How secure is it? GDPR/compliance ready?
8. **IP Assessment:** Any defensible tech? Patents? Trade secrets?
9. **Tech Stack Modernity:** Is the stack current and appropriate?
10. **Team Capability:** Can this team build what they're describing?
11. **Technical Risks:** Specific risks to monitor (3-5 items)

Be realistic but fair. At early stages, perfect tech isn't expected, but the foundation should be solid.`;
  }
}

export async function analyzeStartupTechnical(startup: Startup): Promise<TechnicalAnalysis> {
  const agent = new TechnicalDDAgent();
  return await agent.analyze(startup);
}
