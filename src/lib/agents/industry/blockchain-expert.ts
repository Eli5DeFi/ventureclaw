import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { Startup } from "@prisma/client";

const BlockchainAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  feedback: z.array(z.string()),
  tokenomicsAssessment: z.string().describe("Token economics and distribution strategy"),
  smartContractSecurity: z.string().describe("Smart contract security and audit needs"),
  blockchainChoice: z.string().describe("Evaluation of chosen blockchain/L2"),
  decentralizationLevel: z.string().describe("Degree and appropriateness of decentralization"),
  regulatoryConsiderations: z.string().describe("Crypto-specific regulatory issues"),
  technicalArchitecture: z.string().describe("Blockchain architecture evaluation"),
  communityGovernance: z.string().describe("DAO/governance mechanism assessment"),
});

export type BlockchainAnalysis = z.infer<typeof BlockchainAnalysisSchema>;

export class BlockchainExpertAgent {
  private model: ChatOpenAI;
  
  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.3,
      maxTokens: 2500,
    });
  }
  
  async analyze(startup: Startup): Promise<BlockchainAnalysis> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.getSystemPrompt()],
      ["human", this.getAnalysisPrompt()],
    ]);
    
    const chain = prompt.pipe(
      this.model.withStructuredOutput(BlockchainAnalysisSchema)
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
      
      return result as BlockchainAnalysis;
    } catch (error) {
      console.error("Blockchain analysis failed:", error);
      throw new Error(`Blockchain analysis failed: ${error}`);
    }
  }
  
  private getSystemPrompt(): string {
    return `You are an elite blockchain and Web3 expert with deep expertise in:
- Tokenomics and token distribution models
- Smart contract security and auditing
- Layer 1 and Layer 2 blockchain architectures (Ethereum, Base, Optimism, Arbitrum, etc.)
- DeFi protocols and crypto economics
- DAO governance mechanisms
- Regulatory compliance (SEC, CFTC, international crypto regulations)
- NFT technology and marketplaces
- Cross-chain interoperability
- Wallet infrastructure and custody

Your experience includes:
- 8+ years in blockchain development and investing
- Audited 100+ smart contracts
- Deep understanding of EVM, Solana, Cosmos ecosystems
- Expert in MEV, gas optimization, and scaling solutions
- Knowledge of crypto regulatory landscape globally

Your analysis focuses on:
1. **Tokenomics:** Is the token model sustainable and value-accruing?
2. **Technical Architecture:** Is the blockchain choice appropriate?
3. **Security:** Are smart contracts secure? Audit needs?
4. **Decentralization:** Is decentralization necessary and well-designed?
5. **Regulatory Risk:** What are the compliance considerations?
6. **Community & Governance:** How will the community participate?
7. **Market Fit:** Does this need blockchain, or is it blockchain for blockchain's sake?

You are honest about when blockchain is NOT needed and can identify "crypto theater."`;
  }
  
  private getAnalysisPrompt(): string {
    return `Analyze this blockchain/Web3 startup:

**Startup Details:**
- Name: {name}
- Tagline: {tagline}
- Industry: {industry}
- Stage: {stage}
- Description: {description}
- Funding Ask: ${"{fundingAsk}"}

**Your Task:**
Provide a comprehensive blockchain-specific analysis:

1. **Score (0-100):** Overall blockchain strategy and execution quality
2. **Confidence (0-100):** How confident are you in this assessment?
3. **Strengths:** Blockchain-specific advantages (3-5 points)
4. **Concerns:** Technical or strategic risks (3-5 points)
5. **Feedback:** Detailed analysis (5-7 points on tokenomics, tech, etc.)
6. **Tokenomics Assessment:** Evaluate token model, distribution, utility, value capture
7. **Smart Contract Security:** Security posture, audit recommendations
8. **Blockchain Choice:** Is the chosen chain (if mentioned) appropriate? Recommend alternatives
9. **Decentralization Level:** Is decentralization appropriate for this use case?
10. **Regulatory Considerations:** SEC/CFTC risks, international compliance
11. **Technical Architecture:** Evaluate the technical design (if available)
12. **Community Governance:** Assess DAO/governance mechanisms

Be brutally honest about whether blockchain adds value or is just hype.`;
  }
}

export async function analyzeBlockchain(startup: Startup): Promise<BlockchainAnalysis> {
  const agent = new BlockchainExpertAgent();
  return await agent.analyze(startup);
}
