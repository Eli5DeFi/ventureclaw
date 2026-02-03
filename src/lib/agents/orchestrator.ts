import type { Startup } from "@prisma/client";
import { FinancialAnalystAgent, type FinancialAnalysis } from "./financial-analyst";
import { TechnicalDDAgent, type TechnicalAnalysis } from "./technical-dd";
import { MarketResearchAgent, type MarketAnalysis } from "./market-research";
import { LegalComplianceAgent, type LegalAnalysis } from "./legal-compliance";
import { BlockchainExpertAgent, type BlockchainAnalysis } from "./industry/blockchain-expert";
import { selectAgents, getAgentBreakdown, type AgentDefinition } from "./agent-registry";
import { prisma } from "../prisma";

export interface CompleteAnalysis {
  financial: FinancialAnalysis;
  technical: TechnicalAnalysis;
  market: MarketAnalysis;
  legal: LegalAnalysis;
  blockchain?: BlockchainAnalysis;
  industrySpecific?: Record<string, any>;
  agentBreakdown: {
    total: number;
    core: number;
    industry: number;
    specialist: number;
    estimatedCost: number;
    agents: Array<{ id: string; name: string; capability: string; priority: number }>;
  };
  synthesis: {
    overallScore: number;
    recommendation: "APPROVED" | "CONDITIONAL" | "REJECTED";
    valuation: number;
    summary: string;
    keyStrengths: string[];
    keyConcerns: string[];
    nextSteps: string[];
  };
}

export class AnalysisOrchestrator {
  private financialAgent: FinancialAnalystAgent;
  private technicalAgent: TechnicalDDAgent;
  private marketAgent: MarketResearchAgent;
  private legalAgent: LegalComplianceAgent;
  
  constructor() {
    this.financialAgent = new FinancialAnalystAgent();
    this.technicalAgent = new TechnicalDDAgent();
    this.marketAgent = new MarketResearchAgent();
    this.legalAgent = new LegalComplianceAgent();
  }
  
  async analyzeStartup(startupId: string): Promise<CompleteAnalysis> {
    // 1. Get startup data
    const startup = await prisma.startup.findUnique({
      where: { id: startupId },
    });
    
    if (!startup) {
      throw new Error(`Startup not found: ${startupId}`);
    }
    
    // 2. Update status to analyzing
    await prisma.startup.update({
      where: { id: startupId },
      data: { status: "ANALYZING" },
    });
    
    // Track start time
    const analysisStartedAt = new Date();
    
    try {
      // 3. Dynamically select agents based on startup characteristics
      const selectedAgents = selectAgents(startup);
      const agentBreakdown = getAgentBreakdown(startup);
      
      console.log(`[Orchestrator] Spawning ${agentBreakdown.total} agents for ${startup.name}`);
      console.log(`[Orchestrator] Cost estimate: $${agentBreakdown.estimatedCost.toFixed(2)}`);
      
      // 4. Run core agents (always)
      const [financial, technical, market, legal] = await Promise.all([
        this.runWithTracking(startupId, "FINANCIAL_ANALYST", () => 
          this.financialAgent.analyze(startup)
        ),
        this.runWithTracking(startupId, "TECHNICAL_DD", () => 
          this.technicalAgent.analyze(startup)
        ),
        this.runWithTracking(startupId, "MARKET_RESEARCH", () => 
          this.marketAgent.analyze(startup)
        ),
        this.runWithTracking(startupId, "LEGAL_COMPLIANCE", () => 
          this.legalAgent.analyze(startup)
        ),
      ]);
      
      // 5. Run industry-specific agents if needed
      let blockchain: BlockchainAnalysis | undefined;
      const industrySpecific: Record<string, any> = {};
      
      for (const agent of selectedAgents) {
        if (agent.capability === "blockchain_analysis") {
          const blockchainAgent = new BlockchainExpertAgent();
          blockchain = await this.runWithTracking(startupId, "BLOCKCHAIN_EXPERT", () =>
            blockchainAgent.analyze(startup)
          );
        }
        // Add more industry agents here as they're implemented
        // e.g., AI/ML, Healthcare, FinTech, etc.
      }
      
      // 4. Synthesize results
      const synthesis = this.synthesizeAnalysis(financial, technical, market, legal);
      
      // 5. Calculate analysis duration
      const analysisCompletedAt = new Date();
      const analysisDuration = Math.round(
        (analysisCompletedAt.getTime() - analysisStartedAt.getTime()) / 1000
      );
      
      // 6. Save analysis to database
      await prisma.analysis.create({
        data: {
          startupId,
          financialScore: financial.score,
          technicalScore: technical.score,
          marketScore: market.score,
          legalScore: legal.score,
          overallScore: synthesis.overallScore,
          
          financialFeedback: financial as any,
          technicalFeedback: technical as any,
          marketFeedback: market as any,
          legalFeedback: legal as any,
          
          valuation: BigInt(synthesis.valuation),
          recommendation: synthesis.recommendation,
          summary: synthesis.summary,
          
          analysisStartedAt,
          analysisCompletedAt,
          analysisDuration,
        },
      });
      
      // 7. Update startup status
      await prisma.startup.update({
        where: { id: startupId },
        data: {
          status: synthesis.recommendation === "APPROVED" ? "APPROVED" :
                  synthesis.recommendation === "CONDITIONAL" ? "CONDITIONAL" :
                  "REJECTED",
        },
      });
      
      return {
        financial,
        technical,
        market,
        legal,
        blockchain,
        industrySpecific,
        agentBreakdown,
        synthesis,
      };
      
    } catch (error) {
      // Mark as failed
      await prisma.startup.update({
        where: { id: startupId },
        data: { status: "PENDING" },
      });
      
      throw error;
    }
  }
  
  private async runWithTracking<T>(
    startupId: string,
    agentType: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startedAt = new Date();
    
    // Create activity record
    const activity = await prisma.agentActivity.create({
      data: {
        startupId,
        agentName: this.getAgentName(agentType),
        agentType: agentType as any,
        action: "analyze",
        description: `Analyzing ${agentType.toLowerCase().replace("_", " ")}`,
        status: "RUNNING",
        startedAt,
      },
    });
    
    try {
      const result = await fn();
      
      // Update activity as completed
      const completedAt = new Date();
      await prisma.agentActivity.update({
        where: { id: activity.id },
        data: {
          status: "COMPLETED",
          completedAt,
          duration: completedAt.getTime() - startedAt.getTime(),
          result: `Score: ${(result as any).score}/100`,
        },
      });
      
      return result;
    } catch (error) {
      // Update activity as failed
      await prisma.agentActivity.update({
        where: { id: activity.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: String(error),
        },
      });
      
      throw error;
    }
  }
  
  private getAgentName(agentType: string): string {
    const names: Record<string, string> = {
      FINANCIAL_ANALYST: "Financial Analyst",
      TECHNICAL_DD: "Technical DD",
      MARKET_RESEARCH: "Market Research",
      LEGAL_COMPLIANCE: "Legal & Compliance",
    };
    return names[agentType] || agentType;
  }
  
  private synthesizeAnalysis(
    financial: FinancialAnalysis,
    technical: TechnicalAnalysis,
    market: MarketAnalysis,
    legal: LegalAnalysis
  ): CompleteAnalysis["synthesis"] {
    // Calculate weighted overall score
    const overallScore = Math.round(
      financial.score * 0.30 +    // 30% weight
      technical.score * 0.25 +     // 25% weight
      market.score * 0.30 +        // 30% weight
      legal.score * 0.15           // 15% weight
    );
    
    // Determine recommendation
    let recommendation: "APPROVED" | "CONDITIONAL" | "REJECTED";
    if (overallScore >= 75) {
      recommendation = "APPROVED";
    } else if (overallScore >= 55) {
      recommendation = "CONDITIONAL";
    } else {
      recommendation = "REJECTED";
    }
    
    // Use financial agent's valuation as base
    const valuation = financial.valuation;
    
    // Aggregate strengths and concerns
    const keyStrengths = [
      ...financial.strengths.slice(0, 2),
      ...technical.strengths.slice(0, 2),
      ...market.strengths.slice(0, 2),
    ];
    
    const keyConcerns = [
      ...financial.concerns.slice(0, 2),
      ...technical.concerns.slice(0, 2),
      ...market.concerns.slice(0, 2),
      ...legal.concerns.slice(0, 1),
    ];
    
    // Generate summary
    const summary = this.generateSummary(
      overallScore,
      recommendation,
      financial,
      technical,
      market,
      legal
    );
    
    // Generate next steps
    const nextSteps = this.generateNextSteps(
      recommendation,
      financial,
      technical,
      market,
      legal
    );
    
    return {
      overallScore,
      recommendation,
      valuation,
      summary,
      keyStrengths,
      keyConcerns,
      nextSteps,
    };
  }
  
  private generateSummary(
    overallScore: number,
    recommendation: string,
    financial: FinancialAnalysis,
    technical: TechnicalAnalysis,
    market: MarketAnalysis,
    legal: LegalAnalysis
  ): string {
    const scoreDescriptor = 
      overallScore >= 85 ? "exceptional" :
      overallScore >= 75 ? "strong" :
      overallScore >= 65 ? "solid" :
      overallScore >= 55 ? "promising but needs work" :
      "not ready for funding";
    
    const parts = [
      `This startup is ${scoreDescriptor} with an overall score of ${overallScore}/100.`,
    ];
    
    // Add recommendation context
    if (recommendation === "APPROVED") {
      parts.push("We recommend approval for funding and accelerator admission.");
      parts.push(`The startup demonstrates strong fundamentals across all evaluation criteria.`);
    } else if (recommendation === "CONDITIONAL") {
      parts.push("We recommend conditional approval pending improvements in key areas.");
      parts.push("The startup shows promise but should address identified concerns before final approval.");
    } else {
      parts.push("We do not recommend funding at this time.");
      parts.push("The startup needs significant improvements before reapplying.");
    }
    
    // Highlight top scores
    const scores = [
      { name: "Financial", score: financial.score },
      { name: "Technical", score: technical.score },
      { name: "Market", score: market.score },
      { name: "Legal", score: legal.score },
    ].sort((a, b) => b.score - a.score);
    
    parts.push(
      `Strongest areas: ${scores[0].name} (${scores[0].score}/100) and ${scores[1].name} (${scores[1].score}/100).`
    );
    
    if (scores[3].score < 60) {
      parts.push(
        `Area needing attention: ${scores[3].name} (${scores[3].score}/100).`
      );
    }
    
    return parts.join(" ");
  }
  
  private generateNextSteps(
    recommendation: string,
    financial: FinancialAnalysis,
    technical: TechnicalAnalysis,
    market: MarketAnalysis,
    legal: LegalAnalysis
  ): string[] {
    if (recommendation === "APPROVED") {
      return [
        "Begin VC matching process with our network",
        "Set up Futarchy prediction market for community validation",
        "Prepare ICO fundraising campaign",
        "Schedule onboarding call with accelerator team",
        "Access full suite of AI coaching and marketing agents",
      ];
    }
    
    if (recommendation === "CONDITIONAL") {
      const steps: string[] = ["Address the following concerns before final approval:"];
      
      // Add specific concerns
      if (financial.score < 65) {
        steps.push("- Refine financial projections and revenue model");
      }
      if (technical.score < 65) {
        steps.push("- Strengthen technical infrastructure and scalability plan");
      }
      if (market.score < 65) {
        steps.push("- Better define market positioning and GTM strategy");
      }
      if (legal.score < 65) {
        steps.push("- Address legal and compliance requirements");
      }
      
      steps.push("Resubmit pitch once improvements are made (free resubmission)");
      
      return steps;
    }
    
    // REJECTED
    return [
      "Significant improvements needed across multiple areas",
      "Consider refining the core business model and value proposition",
      "Build more traction before reapplying (users, revenue, partnerships)",
      "Access our coaching agents for guidance on improvements",
      "Reapply in 3-6 months after addressing feedback",
    ];
  }
}

// Helper function for API routes
export async function analyzeStartup(startupId: string): Promise<CompleteAnalysis> {
  const orchestrator = new AnalysisOrchestrator();
  return await orchestrator.analyzeStartup(startupId);
}
