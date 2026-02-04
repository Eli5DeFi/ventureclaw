import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SharkPersonality {
  name: string;
  title: string;
  specialty: string[];
  personality: string;
  investmentStyle: string;
  signatureQuote: string;
  avatar: string;
}

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
}

export interface SharkAnalysis {
  sharkName: string;
  interestLevel: number; // 0-100
  strengths: string[];
  concerns: string[];
  questions: string[];
  reasoning: string;
}

export interface SharkOffer {
  sharkName: string;
  interested: boolean;
  amount?: number;
  equity?: number;
  dealStructure: 'equity' | 'debt' | 'royalty' | 'hybrid';
  terms?: string;
  conditions?: string[];
  reasoning: string;
}

export abstract class SharkAgent {
  protected personality: SharkPersonality;

  constructor(personality: SharkPersonality) {
    this.personality = personality;
  }

  abstract analyzePitch(pitch: Pitch): Promise<SharkAnalysis>;
  abstract makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer>;
  abstract respondToQuestion(pitch: Pitch, question: string): Promise<string>;

  protected async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  }

  protected getSystemPrompt(): string {
    return `You are ${this.personality.name}, a legendary investor from Shark Tank.

PERSONALITY: ${this.personality.personality}

SPECIALTY: ${this.personality.specialty.join(', ')}

INVESTMENT STYLE: ${this.personality.investmentStyle}

SIGNATURE QUOTE: "${this.personality.signatureQuote}"

You evaluate startups from your unique perspective. Be authentic to your character:
- Use your signature phrases and mannerisms
- Focus on areas within your specialty
- Make decisions aligned with your investment style
- Be tough but fair in your analysis
- Show enthusiasm when genuinely interested
- Be direct when saying "I'm out"

Always respond in character. Be specific, actionable, and true to your personality.`;
  }
}

export class MarkCubanAI extends SharkAgent {
  constructor() {
    super({
      name: 'Mark Cuban',
      title: 'Tech Billionaire',
      specialty: ['Tech', 'SaaS', 'Scalable Businesses', 'AI/ML'],
      personality: 'Direct, numbers-focused, loves tech disruption, analytical',
      investmentStyle: 'Large checks, hands-off, expects high growth',
      signatureQuote: 'Show me the metrics, show me the scale',
      avatar: '🏀',
    });
  }

  async analyzePitch(pitch: Pitch): Promise<SharkAnalysis> {
    const prompt = `Analyze this pitch:
    
Company: ${pitch.name}
Tagline: ${pitch.tagline}
Industry: ${pitch.industry}
Stage: ${pitch.stage}
Asking: $${pitch.fundingAsk.toLocaleString()} at $${pitch.valuation.toLocaleString()} valuation
Revenue: ${pitch.revenue ? `$${pitch.revenue.toLocaleString()}` : 'Pre-revenue'}
Users: ${pitch.users?.toLocaleString() || 'N/A'}
Team: ${pitch.teamSize} people
Description: ${pitch.description}

Provide your analysis focusing on:
1. Tech scalability and competitive advantage
2. Market size and growth potential
3. Unit economics and path to profitability
4. Team's technical capability

Format as JSON:
{
  "interestLevel": 0-100,
  "strengths": ["point1", "point2", ...],
  "concerns": ["concern1", "concern2", ...],
  "questions": ["question1", "question2", ...],
  "reasoning": "your detailed thoughts"
}`;

    const response = await this.generateResponse(this.getSystemPrompt(), prompt);
    
    try {
      const analysis = JSON.parse(response);
      return {
        sharkName: this.personality.name,
        ...analysis,
      };
    } catch (e) {
      return {
        sharkName: this.personality.name,
        interestLevel: 50,
        strengths: ['Tech-focused'],
        concerns: ['Need more data'],
        questions: ['What are your metrics?'],
        reasoning: response,
      };
    }
  }

  async makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer> {
    if (analysis.interestLevel < 60) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "I'm out. " + analysis.reasoning,
      };
    }

    const prompt = `Based on your analysis (interest: ${analysis.interestLevel}/100), make an offer for ${pitch.name}.

Company asking: $${pitch.fundingAsk.toLocaleString()} at $${pitch.valuation.toLocaleString()} valuation

Your analysis showed:
Strengths: ${analysis.strengths.join(', ')}
Concerns: ${analysis.concerns.join(', ')}

Make a competitive offer that reflects:
1. Your bullish/bearish view
2. The company's stage and traction
3. Your investment style (large checks, high growth expectations)

Format as JSON:
{
  "interested": true,
  "amount": number,
  "equity": number (percentage),
  "dealStructure": "equity" | "debt" | "royalty" | "hybrid",
  "terms": "any special terms",
  "conditions": ["condition1", "condition2"],
  "reasoning": "why you're making this offer"
}`;

    const response = await this.generateResponse(this.getSystemPrompt(), prompt);

    try {
      const offer = JSON.parse(response);
      return {
        sharkName: this.personality.name,
        ...offer,
      };
    } catch (e) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "I'm out. Can't structure a deal that works.",
      };
    }
  }

  async respondToQuestion(pitch: Pitch, question: string): Promise<string> {
    const prompt = `You're in a Shark Tank pitch for ${pitch.name}.

Founder asks: "${question}"

Respond authentically as Mark Cuban. Be direct, focus on metrics and scalability.`;

    return this.generateResponse(this.getSystemPrompt(), prompt);
  }
}

// Export all shark agents
export { SharkAgent, SharkPersonality, SharkAnalysis, SharkOffer, Pitch };
