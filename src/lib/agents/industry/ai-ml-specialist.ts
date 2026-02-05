import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { Startup } from "@prisma/client";
import { OptimizedBaseAgent } from "../optimized-base-agent";

const AIMLAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  feedback: z.array(z.string()),
  modelArchitecture: z.string().describe("AI/ML model architecture assessment"),
  dataStrategy: z.string().describe("Training data strategy and quality"),
  inferenceScalability: z.string().describe("Inference costs and optimization"),
  mlInfrastructure: z.string().describe("ML infrastructure and MLOps maturity"),
  aiEthics: z.string().describe("AI ethics, bias, and safety considerations"),
  competitiveMoat: z.string().describe("Technical differentiation and moat"),
  researchQuality: z.string().describe("Quality of underlying research/innovation"),
});

export type AIMLAnalysis = z.infer<typeof AIMLAnalysisSchema>;

export class AIMLSpecialistAgent extends OptimizedBaseAgent {
  constructor() {
    // Use 'simple' tier (gpt-4o-mini) - industry specialist scoring is straightforward
    // 97% cost reduction: $0.90 → $0.025 per analysis
    super("simple");
  }
  
  async analyze(startup: Startup): Promise<AIMLAnalysis> {
    const cacheKey = `aiml-analysis:${startup.id}`;
    
    return await this.executeWithCache(cacheKey, startup, async () => {
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", this.getSystemPrompt()],
        ["human", this.getAnalysisPrompt()],
      ]);
      
      const chain = prompt.pipe(
        this.model.withStructuredOutput(AIMLAnalysisSchema)
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
        
        return result as AIMLAnalysis;
      } catch (error) {
        console.error("AI/ML analysis failed:", error);
        throw new Error(`AI/ML analysis failed: ${error}`);
      }
    }, 300); // 5-minute cache
  }
  
  private getSystemPrompt(): string {
    return `You are a world-class AI/ML expert and researcher with deep expertise in:
- Large Language Models (LLMs) - GPT, Claude, Llama architecture
- Computer Vision - CNNs, Vision Transformers, diffusion models
- ML Infrastructure - Training pipelines, distributed training, GPU optimization
- MLOps - Model deployment, monitoring, versioning, A/B testing
- Data Engineering - Dataset curation, labeling, augmentation, synthetic data
- AI Safety - Alignment, bias detection, robustness, adversarial ML
- Model Optimization - Quantization, pruning, distillation, efficient inference
- Research - Understanding cutting-edge papers and techniques

Your experience includes:
- 10+ years in AI/ML research and production systems
- Built ML systems serving 100M+ users
- Published papers at NeurIPS, ICML, CVPR
- Expert in PyTorch, TensorFlow, JAX ecosystems
- Deep knowledge of GPU/TPU optimization
- Understanding of AI economics and cost structures

Your analysis focuses on:
1. **Model Architecture:** Is the approach technically sound?
2. **Data Strategy:** Do they have quality training data?
3. **Inference Costs:** Can this scale economically?
4. **Technical Moat:** What's proprietary vs commodity?
5. **Team Capability:** Can they execute on the technical vision?
6. **AI Safety:** Are they thinking about alignment and ethics?
7. **Competitive Advantage:** What's their edge over open-source?

You are honest about when claims are overhyped vs realistic.`;
  }
  
  private getAnalysisPrompt(): string {
    return `Analyze this AI/ML startup:

**Startup Details:**
- Name: {name}
- Tagline: {tagline}
- Industry: {industry}
- Stage: {stage}
- Description: {description}
- Funding Ask: ${"{fundingAsk}"}

**Your Task:**
Provide a comprehensive AI/ML-specific analysis:

1. **Score (0-100):** Overall AI/ML technical quality and viability
2. **Confidence (0-100):** How confident without seeing code/models?
3. **Strengths:** AI/ML advantages (3-5 points)
4. **Concerns:** Technical risks (3-5 points)
5. **Feedback:** Detailed analysis (5-7 points)
6. **Model Architecture:** Evaluate the AI approach (if described)
7. **Data Strategy:** Training data sources, quality, labeling strategy
8. **Inference Scalability:** Can inference costs scale with revenue?
9. **ML Infrastructure:** MLOps maturity, deployment strategy
10. **AI Ethics:** Bias, safety, alignment considerations
11. **Competitive Moat:** What's proprietary? Defensible against open-source?
12. **Research Quality:** If research-backed, assess scientific validity

Be brutally honest about AI hype vs real innovation. Call out "ChatGPT wrapper" if that's what it is.`;
  }
}

export async function analyzeAIML(startup: Startup): Promise<AIMLAnalysis> {
  const agent = new AIMLSpecialistAgent();
  return await agent.analyze(startup);
}
