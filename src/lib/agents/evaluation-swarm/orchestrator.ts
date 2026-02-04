/**
 * VentureClaw Evaluation Swarm - Dynamic Agent Orchestrator
 * 
 * Instead of static "shark" personalities, this system spawns specialized
 * evaluation agents based on the startup's actual needs. Agents can spawn
 * sub-agents for deeper analysis and coordinate to reach consensus.
 * 
 * Architecture:
 * 1. Orchestrator analyzes submission → identifies required expertise
 * 2. Spawns relevant expert agents (DeFi, B2B SaaS, Hardware, etc.)
 * 3. Each expert spawns sub-agents if needed (Security, Token Economics, etc.)
 * 4. Agents collaborate, debate, and reach consensus
 * 5. Generate investment offers with detailed reasoning
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// Types
// ============================================================================

export interface Pitch {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  stage: string;
  fundingAsk: number;
  valuation: number;
  revenue?: number;
  users?: number;
  teamSize: number;
  founderName: string;
  founderBackground: string;
  traction?: string;
  metrics?: Record<string, any>;
  techStack?: string[];
  businessModel?: string;
}

export interface AgentCapability {
  domain: string;
  expertise: string[];
  spawnsTriggers: string[]; // Conditions that cause this agent to spawn
  canSpawnSubAgents: boolean;
  subAgentTypes?: string[];
}

export interface EvaluationAgent {
  id: string;
  type: string;
  domain: string;
  parentAgentId?: string;
  capability: AgentCapability;
  spawnedAt: number;
}

export interface AgentAnalysis {
  agentId: string;
  agentType: string;
  domain: string;
  confidence: number; // 0-100
  verdict: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  strengths: string[];
  weaknesses: string[];
  criticalQuestions: string[];
  recommendations: string[];
  subAgentAnalyses?: AgentAnalysis[];
  reasoning: string;
  metadata: {
    analysisDepth: 'shallow' | 'medium' | 'deep';
    timeSpentMs: number;
    subAgentsSpawned: number;
  };
}

export interface InvestmentOffer {
  offerId: string;
  agentId: string;
  agentType: string;
  interested: boolean;
  amount?: number;
  equity?: number;
  dealStructure: 'equity' | 'safe' | 'convertible' | 'revenue_share' | 'hybrid';
  terms?: string;
  conditions?: string[];
  expectedReturn: string;
  timeHorizon: string;
  reasoning: string;
  confidence: number;
}

export interface SwarmEvaluation {
  pitchId: string;
  timestamp: number;
  orchestratorDecision: {
    spawnedAgents: EvaluationAgent[];
    totalAgentsSpawned: number;
    evaluationStrategy: string;
  };
  agentAnalyses: AgentAnalysis[];
  consensus: {
    overallVerdict: 'accept' | 'reject' | 'needs_revision';
    confidenceScore: number;
    topStrengths: string[];
    topWeaknesses: string[];
    criticalIssues: string[];
  };
  offers: InvestmentOffer[];
  executionTimeMs: number;
}

// ============================================================================
// Agent Registry - Available Expert Agents
// ============================================================================

const AGENT_REGISTRY: Record<string, AgentCapability> = {
  // Tech & Product Agents
  DEFI_PROTOCOL_EXPERT: {
    domain: 'DeFi & Crypto',
    expertise: ['Smart contracts', 'Tokenomics', 'DeFi mechanics', 'Protocol design', 'MEV', 'Liquidity'],
    spawnsTriggers: ['defi', 'crypto', 'blockchain', 'token', 'protocol', 'smart contract'],
    canSpawnSubAgents: true,
    subAgentTypes: ['TOKENOMICS_SPECIALIST', 'SECURITY_AUDITOR', 'LIQUIDITY_ANALYST'],
  },
  
  B2B_SAAS_EXPERT: {
    domain: 'B2B SaaS',
    expertise: ['SaaS metrics', 'Enterprise sales', 'Product-market fit', 'Churn analysis', 'CAC/LTV'],
    spawnsTriggers: ['saas', 'b2b', 'enterprise', 'software', 'platform'],
    canSpawnSubAgents: true,
    subAgentTypes: ['GTM_STRATEGIST', 'PRICING_ANALYST'],
  },
  
  AI_ML_EXPERT: {
    domain: 'AI & Machine Learning',
    expertise: ['ML models', 'Data pipelines', 'AI product design', 'Compute economics', 'Model training'],
    spawnsTriggers: ['ai', 'machine learning', 'ml', 'neural network', 'llm', 'gpt'],
    canSpawnSubAgents: true,
    subAgentTypes: ['DATA_SCIENTIST', 'ML_ENGINEER'],
  },
  
  CONSUMER_PRODUCT_EXPERT: {
    domain: 'Consumer Products',
    expertise: ['User acquisition', 'Retention', 'Viral growth', 'Monetization', 'Community'],
    spawnsTriggers: ['consumer', 'b2c', 'mobile app', 'social', 'marketplace'],
    canSpawnSubAgents: true,
    subAgentTypes: ['GROWTH_HACKER', 'COMMUNITY_STRATEGIST'],
  },
  
  HARDWARE_EXPERT: {
    domain: 'Hardware & IoT',
    expertise: ['Manufacturing', 'Supply chain', 'Unit economics', 'Hardware/software integration'],
    spawnsTriggers: ['hardware', 'iot', 'device', 'manufacturing', 'physical product'],
    canSpawnSubAgents: true,
    subAgentTypes: ['SUPPLY_CHAIN_ANALYST', 'MANUFACTURING_EXPERT'],
  },
  
  BIOTECH_EXPERT: {
    domain: 'Biotech & Health',
    expertise: ['Clinical trials', 'Regulatory pathways', 'FDA approval', 'R&D pipeline'],
    spawnsTriggers: ['biotech', 'health', 'medical', 'pharma', 'clinical'],
    canSpawnSubAgents: true,
    subAgentTypes: ['REGULATORY_SPECIALIST', 'CLINICAL_ADVISOR'],
  },

  // Cross-functional Agents (Always Spawn)
  FINANCIAL_ANALYST: {
    domain: 'Finance & Metrics',
    expertise: ['Financial modeling', 'Unit economics', 'Burn rate', 'Revenue projections', 'Valuation'],
    spawnsTriggers: ['*'], // Always spawn
    canSpawnSubAgents: true,
    subAgentTypes: ['VALUATION_MODELER'],
  },
  
  MARKET_ANALYST: {
    domain: 'Market & Competition',
    expertise: ['Market sizing', 'TAM/SAM/SOM', 'Competitive analysis', 'Market trends'],
    spawnsTriggers: ['*'], // Always spawn
    canSpawnSubAgents: false,
  },
  
  TEAM_EVALUATOR: {
    domain: 'Team & Execution',
    expertise: ['Founder assessment', 'Team composition', 'Execution capability', 'Culture'],
    spawnsTriggers: ['*'], // Always spawn
    canSpawnSubAgents: false,
  },

  // Sub-Agent Specialists
  TOKENOMICS_SPECIALIST: {
    domain: 'Token Economics',
    expertise: ['Token distribution', 'Vesting schedules', 'Incentive alignment', 'Token utility'],
    spawnsTriggers: [], // Only spawned by parent
    canSpawnSubAgents: false,
  },
  
  SECURITY_AUDITOR: {
    domain: 'Smart Contract Security',
    expertise: ['Vulnerability assessment', 'Audit reports', 'Security best practices'],
    spawnsTriggers: [], // Only spawned by parent
    canSpawnSubAgents: false,
  },
  
  LIQUIDITY_ANALYST: {
    domain: 'Liquidity & Market Making',
    expertise: ['DEX design', 'Liquidity pools', 'Market making', 'Slippage analysis'],
    spawnsTriggers: [], // Only spawned by parent
    canSpawnSubAgents: false,
  },
  
  GTM_STRATEGIST: {
    domain: 'Go-To-Market',
    expertise: ['Sales strategy', 'Channel partnerships', 'Launch planning'],
    spawnsTriggers: [], // Only spawned by parent
    canSpawnSubAgents: false,
  },
  
  PRICING_ANALYST: {
    domain: 'Pricing Strategy',
    expertise: ['Pricing models', 'Value-based pricing', 'Competitive pricing'],
    spawnsTriggers: [], // Only spawned by parent
    canSpawnSubAgents: false,
  },
  
  GROWTH_HACKER: {
    domain: 'Growth & Virality',
    expertise: ['Viral loops', 'Referral programs', 'Growth experiments'],
    spawnsTriggers: [], // Only spawned by parent
    canSpawnSubAgents: false,
  },
};

// ============================================================================
// Orchestrator - Spawns and Coordinates Agents
// ============================================================================

export class EvaluationOrchestrator {
  private pitch: Pitch;
  private spawnedAgents: EvaluationAgent[] = [];
  private analyses: AgentAnalysis[] = [];

  constructor(pitch: Pitch) {
    this.pitch = pitch;
  }

  /**
   * Main evaluation flow:
   * 1. Analyze pitch to determine required agents
   * 2. Spawn relevant expert agents
   * 3. Each agent performs analysis (may spawn sub-agents)
   * 4. Coordinate and synthesize results
   * 5. Generate investment offers
   */
  async evaluate(): Promise<SwarmEvaluation> {
    const startTime = Date.now();

    // Step 1: Determine which agents to spawn
    const agentsToSpawn = await this.determineRequiredAgents();

    // Step 2: Spawn and execute agents in parallel
    const analysisPromises = agentsToSpawn.map(agent => 
      this.executeAgent(agent)
    );
    this.analyses = await Promise.all(analysisPromises);

    // Step 3: Synthesize consensus
    const consensus = await this.synthesizeConsensus();

    // Step 4: Generate investment offers
    const offers = await this.generateOffers(consensus);

    const executionTimeMs = Date.now() - startTime;

    return {
      pitchId: this.pitch.id,
      timestamp: Date.now(),
      orchestratorDecision: {
        spawnedAgents: this.spawnedAgents,
        totalAgentsSpawned: this.spawnedAgents.length,
        evaluationStrategy: this.getEvaluationStrategy(),
      },
      agentAnalyses: this.analyses,
      consensus,
      offers,
      executionTimeMs,
    };
  }

  /**
   * Intelligently determine which expert agents to spawn based on pitch content
   */
  private async determineRequiredAgents(): Promise<EvaluationAgent[]> {
    const agents: EvaluationAgent[] = [];
    const pitchContent = `${this.pitch.name} ${this.pitch.tagline} ${this.pitch.description} ${this.pitch.industry}`.toLowerCase();

    // Always spawn cross-functional agents
    for (const [agentType, capability] of Object.entries(AGENT_REGISTRY)) {
      if (capability.spawnsTriggers.includes('*')) {
        agents.push({
          id: `${agentType}_${Date.now()}`,
          type: agentType,
          domain: capability.domain,
          capability,
          spawnedAt: Date.now(),
        });
      }
    }

    // Spawn domain-specific agents based on triggers
    for (const [agentType, capability] of Object.entries(AGENT_REGISTRY)) {
      if (capability.spawnsTriggers.includes('*')) continue;

      const shouldSpawn = capability.spawnsTriggers.some(trigger => 
        pitchContent.includes(trigger.toLowerCase())
      );

      if (shouldSpawn) {
        agents.push({
          id: `${agentType}_${Date.now()}`,
          type: agentType,
          domain: capability.domain,
          capability,
          spawnedAt: Date.now(),
        });
      }
    }

    this.spawnedAgents = agents;
    return agents;
  }

  /**
   * Execute individual agent analysis (may spawn sub-agents)
   */
  private async executeAgent(agent: EvaluationAgent): Promise<AgentAnalysis> {
    const startTime = Date.now();
    
    // Build agent-specific system prompt
    const systemPrompt = this.buildAgentSystemPrompt(agent);
    
    // Build analysis request
    const userPrompt = this.buildAgentAnalysisPrompt(agent);

    // Execute agent analysis
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const analysisRaw = response.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(analysisRaw);

    // Check if agent should spawn sub-agents
    const subAgentAnalyses: AgentAnalysis[] = [];
    if (agent.capability.canSpawnSubAgents && analysis.shouldSpawnSubAgents) {
      const subAgents = await this.spawnSubAgents(agent, analysis.requiredSubAgents || []);
      const subAnalysesPromises = subAgents.map(subAgent => this.executeAgent(subAgent));
      subAgentAnalyses.push(...await Promise.all(subAnalysesPromises));
    }

    const timeSpentMs = Date.now() - startTime;

    return {
      agentId: agent.id,
      agentType: agent.type,
      domain: agent.domain,
      confidence: analysis.confidence || 70,
      verdict: analysis.verdict || 'maybe',
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      criticalQuestions: analysis.criticalQuestions || [],
      recommendations: analysis.recommendations || [],
      subAgentAnalyses,
      reasoning: analysis.reasoning || '',
      metadata: {
        analysisDepth: subAgentAnalyses.length > 0 ? 'deep' : 'medium',
        timeSpentMs,
        subAgentsSpawned: subAgentAnalyses.length,
      },
    };
  }

  /**
   * Spawn sub-agents for deeper analysis
   */
  private async spawnSubAgents(parentAgent: EvaluationAgent, requiredSubAgents: string[]): Promise<EvaluationAgent[]> {
    const subAgents: EvaluationAgent[] = [];

    for (const subAgentType of requiredSubAgents) {
      const capability = AGENT_REGISTRY[subAgentType];
      if (!capability) continue;

      subAgents.push({
        id: `${subAgentType}_${Date.now()}`,
        type: subAgentType,
        domain: capability.domain,
        parentAgentId: parentAgent.id,
        capability,
        spawnedAt: Date.now(),
      });
    }

    this.spawnedAgents.push(...subAgents);
    return subAgents;
  }

  /**
   * Build agent-specific system prompt
   */
  private buildAgentSystemPrompt(agent: EvaluationAgent): string {
    return `You are an expert ${agent.domain} evaluation agent in the VentureClaw AI accelerator swarm.

**Your Domain:** ${agent.domain}
**Your Expertise:** ${agent.capability.expertise.join(', ')}

**Your Role:**
You are part of a collaborative agent swarm evaluating startup pitches. Your job is to:
1. Analyze the pitch from your domain expertise perspective
2. Identify strengths and weaknesses specific to your domain
3. Ask critical questions that must be answered
4. Determine if sub-agents are needed for deeper analysis
5. Provide a clear verdict with confidence score

**Response Format (JSON):**
{
  "confidence": 0-100,
  "verdict": "strong_yes" | "yes" | "maybe" | "no" | "strong_no",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "criticalQuestions": ["question1", "question2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "shouldSpawnSubAgents": boolean,
  "requiredSubAgents": ["SUB_AGENT_TYPE1", "SUB_AGENT_TYPE2"] (if shouldSpawnSubAgents),
  "reasoning": "detailed analysis explaining your verdict"
}

${agent.capability.canSpawnSubAgents ? `\n**Available Sub-Agents:** ${agent.capability.subAgentTypes?.join(', ')}\nYou can request sub-agents for specialized deep dives.` : ''}

Be thorough, critical, and specific. Your analysis will be combined with other agents to reach a final decision.`;
  }

  /**
   * Build analysis request prompt
   */
  private buildAgentAnalysisPrompt(agent: EvaluationAgent): string {
    return `Evaluate this startup pitch from your ${agent.domain} expertise:

**Company:** ${this.pitch.name}
**Tagline:** ${this.pitch.tagline}
**Industry:** ${this.pitch.industry}
**Stage:** ${this.pitch.stage}

**Description:**
${this.pitch.description}

**Funding Ask:** $${this.pitch.fundingAsk.toLocaleString()} at $${this.pitch.valuation.toLocaleString()} valuation

**Metrics:**
- Revenue: ${this.pitch.revenue ? `$${this.pitch.revenue.toLocaleString()}` : 'Pre-revenue'}
- Users: ${this.pitch.users?.toLocaleString() || 'N/A'}
- Team Size: ${this.pitch.teamSize}

**Founder:** ${this.pitch.founderName} - ${this.pitch.founderBackground}

${this.pitch.traction ? `**Traction:** ${this.pitch.traction}` : ''}
${this.pitch.businessModel ? `**Business Model:** ${this.pitch.businessModel}` : ''}
${this.pitch.techStack ? `**Tech Stack:** ${this.pitch.techStack.join(', ')}` : ''}

Provide your expert analysis in JSON format as specified.`;
  }

  /**
   * Synthesize consensus from all agent analyses
   */
  private async synthesizeConsensus(): Promise<SwarmEvaluation['consensus']> {
    const verdictCounts = {
      strong_yes: 0,
      yes: 0,
      maybe: 0,
      no: 0,
      strong_no: 0,
    };

    let totalConfidence = 0;
    const allStrengths: string[] = [];
    const allWeaknesses: string[] = [];
    const criticalIssues: string[] = [];

    for (const analysis of this.analyses) {
      verdictCounts[analysis.verdict]++;
      totalConfidence += analysis.confidence;
      allStrengths.push(...analysis.strengths);
      allWeaknesses.push(...analysis.weaknesses);

      if (analysis.verdict === 'no' || analysis.verdict === 'strong_no') {
        criticalIssues.push(`[${analysis.domain}] ${analysis.reasoning.substring(0, 200)}...`);
      }
    }

    const avgConfidence = totalConfidence / this.analyses.length;

    // Determine overall verdict
    let overallVerdict: 'accept' | 'reject' | 'needs_revision' = 'needs_revision';
    if (verdictCounts.strong_yes + verdictCounts.yes >= this.analyses.length * 0.7) {
      overallVerdict = 'accept';
    } else if (verdictCounts.strong_no + verdictCounts.no >= this.analyses.length * 0.5) {
      overallVerdict = 'reject';
    }

    // Get top strengths and weaknesses (most mentioned)
    const strengthCounts = this.countOccurrences(allStrengths);
    const weaknessCounts = this.countOccurrences(allWeaknesses);

    return {
      overallVerdict,
      confidenceScore: Math.round(avgConfidence),
      topStrengths: this.getTopN(strengthCounts, 5),
      topWeaknesses: this.getTopN(weaknessCounts, 5),
      criticalIssues,
    };
  }

  /**
   * Generate investment offers from top agents
   */
  private async generateOffers(consensus: SwarmEvaluation['consensus']): Promise<InvestmentOffer[]> {
    if (consensus.overallVerdict === 'reject') {
      return [];
    }

    // Top agents with high confidence make offers
    const offerAgents = this.analyses
      .filter(a => a.confidence >= 70 && (a.verdict === 'yes' || a.verdict === 'strong_yes'))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 agents make offers

    const offers: InvestmentOffer[] = [];

    for (const agent of offerAgents) {
      const offer = await this.generateOfferFromAgent(agent, consensus);
      if (offer.interested) {
        offers.push(offer);
      }
    }

    return offers;
  }

  /**
   * Generate individual offer from agent
   */
  private async generateOfferFromAgent(
    analysis: AgentAnalysis,
    consensus: SwarmEvaluation['consensus']
  ): Promise<InvestmentOffer> {
    const systemPrompt = `You are the ${analysis.domain} expert agent making an investment offer.

Based on your analysis (confidence: ${analysis.confidence}/100), structure an investment offer for this startup.

Consider:
- Your domain expertise and what you bring to the table
- The startup's stage, traction, and valuation
- Overall consensus: ${consensus.overallVerdict} (confidence: ${consensus.confidenceScore}%)
- Key strengths: ${consensus.topStrengths.join(', ')}
- Key concerns: ${consensus.topWeaknesses.join(', ')}

Provide offer in JSON:
{
  "interested": boolean,
  "amount": number (if interested),
  "equity": number (percentage, if interested),
  "dealStructure": "equity" | "safe" | "convertible" | "revenue_share" | "hybrid",
  "terms": "special terms or conditions",
  "conditions": ["condition1", "condition2"],
  "expectedReturn": "target return description",
  "timeHorizon": "investment time horizon",
  "reasoning": "why this offer structure",
  "confidence": 0-100
}`;

    const userPrompt = `Make an investment offer for ${this.pitch.name}.

Asking: $${this.pitch.fundingAsk.toLocaleString()} at $${this.pitch.valuation.toLocaleString()} valuation

Your analysis showed:
- Verdict: ${analysis.verdict}
- Confidence: ${analysis.confidence}%
- Strengths: ${analysis.strengths.join(', ')}
- Concerns: ${analysis.weaknesses.join(', ')}

Structure your offer.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const offerData = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
      offerId: `offer_${analysis.agentId}_${Date.now()}`,
      agentId: analysis.agentId,
      agentType: analysis.agentType,
      ...offerData,
    };
  }

  // Helper methods
  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopN(counts: Record<string, number>, n: number): string[] {
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, n)
      .map(([item]) => item);
  }

  private getEvaluationStrategy(): string {
    const domainAgents = this.spawnedAgents.filter(a => !a.parentAgentId);
    const subAgents = this.spawnedAgents.filter(a => a.parentAgentId);

    return `Spawned ${domainAgents.length} domain experts (${domainAgents.map(a => a.domain).join(', ')}) with ${subAgents.length} specialized sub-agents for deep analysis.`;
  }
}

// ============================================================================
// Export
// ============================================================================

export { AGENT_REGISTRY };
