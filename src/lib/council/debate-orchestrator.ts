// src/lib/council/debate-orchestrator.ts

import Anthropic from '@anthropic-ai/sdk';

interface DebateAgent {
  id: string;
  name: string;
  role: string;
  personality: string;
  sentiment: number;
  position: 'YES' | 'NO' | 'MAYBE' | null;
  avatar: string;
}

interface DebateMessage {
  speaker: string;
  text: string;
  timestamp: number;
  type: 'question' | 'argument' | 'rebuttal' | 'consensus' | 'reaction';
}

interface BroadcastCallback {
  (data: any): void;
}

export class DebateOrchestrator {
  private anthropic: Anthropic;
  private agents: DebateAgent[];
  private transcript: DebateMessage[];
  private broadcastCallback?: BroadcastCallback;

  constructor(broadcastCallback?: BroadcastCallback) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    });
    this.agents = this.initializeAgents();
    this.transcript = [];
    this.broadcastCallback = broadcastCallback;
  }

  private initializeAgents(): DebateAgent[] {
    return [
      {
        id: 'skeptic',
        name: 'Dr. Sarah Chen',
        role: 'The Skeptic',
        personality: 'Critical, analytical, challenges assumptions. Uses data and logic to poke holes in arguments.',
        sentiment: 0,
        position: null,
        avatar: '🔍'
      },
      {
        id: 'optimist',
        name: 'Marcus Vision',
        role: 'The Optimist',
        personality: 'Enthusiastic, sees potential, focuses on vision. Encourages bold thinking.',
        sentiment: 0,
        position: null,
        avatar: '🚀'
      },
      {
        id: 'financier',
        name: 'Katherine Numbers',
        role: 'The Financier',
        personality: 'Numbers-focused, ROI-driven, demands proof of unit economics.',
        sentiment: 0,
        position: null,
        avatar: '💰'
      },
      {
        id: 'technologist',
        name: 'Alex Code',
        role: 'The Technologist',
        personality: 'Technical depth, evaluates architecture, security, scalability.',
        sentiment: 0,
        position: null,
        avatar: '🔧'
      },
      {
        id: 'strategist',
        name: 'Jordan Market',
        role: 'The Strategist',
        personality: 'Big picture, competitive moats, go-to-market strategy.',
        sentiment: 0,
        position: null,
        avatar: '🎯'
      }
    ];
  }

  async conductDebate(pitch: any): Promise<{
    decision: 'APPROVED' | 'REJECTED';
    confidence: number;
    offers: any[];
    transcript: DebateMessage[];
    agents: DebateAgent[];
  }> {
    console.log('🎭 Starting Live AI Council Debate...');

    // Broadcast initial state
    this.broadcast({
      type: 'debate_started',
      agents: this.agents
    });

    // Phase 1: Initial Reactions (2 min)
    await this.initialReactions(pitch);

    // Phase 2: Questioning Round (5 min)
    await this.questioningRound(pitch);

    // Phase 3: Agent Debate (10 min)
    await this.agentDebate(pitch);

    // Phase 4: Consensus Building (3 min)
    const decision = await this.buildConsensus(pitch);

    // Broadcast completion
    this.broadcast({
      type: 'debate_complete',
      decision: decision.decision,
      confidence: decision.confidence
    });

    return {
      ...decision,
      agents: this.agents
    };
  }

  private async initialReactions(pitch: any) {
    console.log('\n📊 Phase 1: Initial Reactions');

    this.broadcast({
      type: 'phase_change',
      phase: 'initial_reactions',
      description: 'Agents give their first impressions'
    });

    for (const agent of this.agents) {
      const reaction = await this.getAgentReaction(agent, pitch);
      
      this.transcript.push({
        speaker: agent.name,
        text: reaction.text,
        timestamp: Date.now(),
        type: 'reaction'
      });

      // Update sentiment
      agent.sentiment = reaction.sentiment;
      
      // Broadcast to viewers
      this.broadcast({
        type: 'agent_speaking',
        agentId: agent.id,
        agentName: agent.name,
        text: reaction.text,
        avatar: agent.avatar
      });

      this.broadcast({
        type: 'sentiment_update',
        agentId: agent.id,
        sentiment: agent.sentiment
      });

      // Wait between agents
      await this.sleep(2000);
    }
  }

  private async getAgentReaction(agent: DebateAgent, pitch: any) {
    const prompt = `You are ${agent.name}, ${agent.role}.

Personality: ${agent.personality}

A founder just pitched their startup:
Company: ${pitch.companyName}
Industry: ${pitch.industry}
Description: ${pitch.shortDescription}
Traction: ${pitch.monthlyRevenue ? `$${pitch.monthlyRevenue} MRR` : 'Pre-revenue'}
Team: ${pitch.teamSize || 'Unknown'} people

Give your immediate reaction (1-2 sentences). Be true to your personality.

Format:
{
  "text": "Your reaction here",
  "sentiment": 0.5
}

Sentiment scale: -1 (very negative) to 1 (very positive)`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    
    // Parse JSON, handling potential formatting issues
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  private async questioningRound(pitch: any) {
    console.log('\n❓ Phase 2: Questioning Round');

    this.broadcast({
      type: 'phase_change',
      phase: 'questioning',
      description: 'Agents ask tough questions'
    });

    // Each agent asks 1-2 tough questions
    for (const agent of this.agents) {
      const questions = await this.getAgentQuestions(agent, pitch);

      for (const question of questions) {
        this.transcript.push({
          speaker: agent.name,
          text: question,
          timestamp: Date.now(),
          type: 'question'
        });

        this.broadcast({
          type: 'agent_speaking',
          agentId: agent.id,
          agentName: agent.name,
          text: question,
          avatar: agent.avatar
        });

        await this.sleep(3000);

        // In real implementation, wait for founder response
        // For now, simulate
        const founderResponse = `[Founder would respond here via video/audio]`;
        this.transcript.push({
          speaker: 'Founder',
          text: founderResponse,
          timestamp: Date.now(),
          type: 'argument'
        });
      }
    }
  }

  private async getAgentQuestions(agent: DebateAgent, pitch: any): Promise<string[]> {
    const prompt = `You are ${agent.name}, ${agent.role}.

Personality: ${agent.personality}

Based on this pitch:
Company: ${pitch.companyName}
Industry: ${pitch.industry}
Description: ${pitch.shortDescription}
Problem: ${pitch.problemStatement}
Solution: ${pitch.solution}

Ask 1-2 tough, specific questions that would help you evaluate this startup.
Be direct and challenging. Use numbers/examples when possible.

Return as JSON array: ["Question 1", "Question 2"]`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    
    const text = content.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  private async agentDebate(pitch: any) {
    console.log('\n🗣️ Phase 3: Agent Debate');

    this.broadcast({
      type: 'phase_change',
      phase: 'debate',
      description: 'Agents debate each other'
    });

    // Agents debate each other for 8 exchanges
    for (let round = 0; round < 8; round++) {
      // Pick two agents with differing sentiments
      const agents = this.selectDebatePair();
      
      for (const agent of agents) {
        const argument = await this.getDebateArgument(agent, pitch, this.transcript);

        this.transcript.push({
          speaker: agent.name,
          text: argument.text,
          timestamp: Date.now(),
          type: argument.isRebuttal ? 'rebuttal' : 'argument'
        });

        agent.sentiment = argument.sentiment;

        this.broadcast({
          type: 'agent_speaking',
          agentId: agent.id,
          agentName: agent.name,
          text: argument.text,
          avatar: agent.avatar
        });

        this.broadcast({
          type: 'sentiment_update',
          agentId: agent.id,
          sentiment: agent.sentiment
        });

        await this.sleep(4000);
      }
    }
  }

  private selectDebatePair(): DebateAgent[] {
    // Find agents with most different sentiments
    const sorted = [...this.agents].sort((a, b) => a.sentiment - b.sentiment);
    return [sorted[0], sorted[sorted.length - 1]];
  }

  private async getDebateArgument(
    agent: DebateAgent, 
    pitch: any, 
    transcript: DebateMessage[]
  ) {
    const recentDebate = transcript.slice(-5).map(m => `${m.speaker}: ${m.text}`).join('\n');

    const prompt = `You are ${agent.name}, ${agent.role}.

Personality: ${agent.personality}
Current sentiment: ${agent.sentiment}

Pitch: ${pitch.companyName} - ${pitch.shortDescription}

Recent debate:
${recentDebate}

Make your argument. You can:
- Defend your position
- Challenge another agent
- Bring up new points
- Change your mind if convinced

Be conversational and natural. Show personality. Keep it under 50 words.

Format:
{
  "text": "Your argument",
  "sentiment": 0.3,
  "isRebuttal": false
}`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  private async buildConsensus(pitch: any) {
    console.log('\n🤝 Phase 4: Building Consensus');

    this.broadcast({
      type: 'phase_change',
      phase: 'consensus',
      description: 'Agents give final verdicts'
    });

    // Each agent gives final verdict
    for (const agent of this.agents) {
      const verdict = await this.getFinalVerdict(agent, pitch, this.transcript);
      
      agent.position = verdict.position;
      
      this.transcript.push({
        speaker: agent.name,
        text: verdict.text,
        timestamp: Date.now(),
        type: 'consensus'
      });

      this.broadcast({
        type: 'agent_speaking',
        agentId: agent.id,
        agentName: agent.name,
        text: verdict.text,
        avatar: agent.avatar
      });

      this.broadcast({
        type: 'position_update',
        agentId: agent.id,
        position: agent.position
      });

      await this.sleep(3000);
    }

    // Calculate final decision
    const yesVotes = this.agents.filter(a => a.position === 'YES').length;
    const noVotes = this.agents.filter(a => a.position === 'NO').length;
    const maybeVotes = this.agents.filter(a => a.position === 'MAYBE').length;
    
    const decision: 'APPROVED' | 'REJECTED' = yesVotes > noVotes ? 'APPROVED' : 'REJECTED';
    const confidence = Math.abs(yesVotes - noVotes) / this.agents.length;

    console.log(`\n✅ Final Decision: ${decision} (${yesVotes} YES, ${noVotes} NO, ${maybeVotes} MAYBE)`);

    return {
      decision,
      confidence,
      offers: decision === 'APPROVED' ? this.generateOffers(pitch) : [],
      transcript: this.transcript,
      votes: { yes: yesVotes, no: noVotes, maybe: maybeVotes }
    };
  }

  private async getFinalVerdict(
    agent: DebateAgent,
    pitch: any,
    transcript: DebateMessage[]
  ) {
    const debateSummary = transcript.slice(-20).map(m => `${m.speaker}: ${m.text}`).join('\n');

    const prompt = `You are ${agent.name}, ${agent.role}.

After this entire debate:
${debateSummary}

Give your final verdict on whether to fund this startup.

Format:
{
  "position": "YES",
  "text": "My final decision is YES/NO/MAYBE because..."
}

Position must be one of: YES, NO, MAYBE`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }

  private generateOffers(pitch: any): any[] {
    // Generate funding offers from agents who voted YES
    const supportiveAgents = this.agents.filter(a => a.position === 'YES');
    
    return supportiveAgents.map(agent => ({
      id: `offer_${agent.id}_${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      amount: 500000,
      equity: 12,
      dealStructure: 'SAFE',
      valuation: 4166667, // Post-money
      terms: 'SAFE note, $5M cap, 20% discount',
      reasoning: `Based on the debate, I believe this startup has strong potential in ${pitch.industry}.`
    }));
  }

  private broadcast(data: any) {
    if (this.broadcastCallback) {
      this.broadcastCallback(data);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public method to get current state
  getState() {
    return {
      agents: this.agents,
      transcript: this.transcript
    };
  }
}
