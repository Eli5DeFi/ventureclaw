import { SharkAgent, SharkPersonality, Pitch, SharkAnalysis, SharkOffer } from './shark-base';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Base helper for all sharks
async function generateSharkResponse(systemPrompt: string, userPrompt: string): Promise<string> {
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

function createSystemPrompt(personality: SharkPersonality): string {
  return `You are ${personality.name}, ${personality.title}.

PERSONALITY: ${personality.personality}
SPECIALTY: ${personality.specialty.join(', ')}
INVESTMENT STYLE: ${personality.investmentStyle}
SIGNATURE: "${personality.signatureQuote}"

Stay in character. Be authentic. Make tough but fair decisions.`;
}

// Barbara Corcoran AI
export class BarbaraCorcoranAI extends SharkAgent {
  constructor() {
    super({
      name: 'Barbara Corcoran',
      title: 'Real Estate Mogul',
      specialty: ['Consumer Products', 'Retail', 'Branding', 'Direct-to-Consumer'],
      personality: 'People-focused, intuition-driven, marketing genius, warm but tough',
      investmentStyle: 'Mentorship-heavy, brand building, operational support',
      signatureQuote: 'I invest in people, not just ideas',
      avatar: '🏠',
    });
  }

  async analyzePitch(pitch: Pitch): Promise<SharkAnalysis> {
    const prompt = `Analyze ${pitch.name}:
${pitch.description}

Industry: ${pitch.industry} | Stage: ${pitch.stage}
Ask: $${pitch.fundingAsk.toLocaleString()} at $${pitch.valuation.toLocaleString()} valuation

Focus on: founder personality, brand potential, consumer appeal, retail opportunities.

Respond in JSON format with: interestLevel, strengths, concerns, questions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      const parsed = JSON.parse(response);
      return { sharkName: this.personality.name, ...parsed };
    } catch {
      return {
        sharkName: this.personality.name,
        interestLevel: 50,
        strengths: [],
        concerns: [],
        questions: [],
        reasoning: response,
      };
    }
  }

  async makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer> {
    if (analysis.interestLevel < 65) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "I'm out. I don't feel the connection I need.",
      };
    }

    const prompt = `Make an offer for ${pitch.name} (interest: ${analysis.interestLevel}/100).
Ask: $${pitch.fundingAsk.toLocaleString()} at $${pitch.valuation.toLocaleString()}

Focus on: mentorship value, brand building, your network's power.
JSON format: interested, amount, equity, dealStructure, terms, conditions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      const parsed = JSON.parse(response);
      return { sharkName: this.personality.name, ...parsed };
    } catch {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "Can't make this work.",
      };
    }
  }

  async respondToQuestion(pitch: Pitch, question: string): Promise<string> {
    const prompt = `Founder asks: "${question}"\n\nRespond as Barbara - warm, people-focused, brand-obsessed.`;
    return generateSharkResponse(createSystemPrompt(this.personality), prompt);
  }
}

// Kevin O'Leary AI
export class KevinOLearyAI extends SharkAgent {
  constructor() {
    super({
      name: "Kevin O'Leary",
      title: 'Mr. Wonderful',
      specialty: ['Financial Returns', 'Debt Deals', 'Royalties', 'Profitability'],
      personality: 'Ruthless, profit-obsessed, deal structure master, brutally honest',
      investmentStyle: 'Royalty deals, debt financing, expects quick returns',
      signatureQuote: "I'm here to make money, not friends",
      avatar: '💰',
    });
  }

  async analyzePitch(pitch: Pitch): Promise<SharkAnalysis> {
    const prompt = `${pitch.name} pitch analysis.
Revenue: ${pitch.revenue ? `$${pitch.revenue.toLocaleString()}` : 'Pre-revenue'}
Ask: $${pitch.fundingAsk.toLocaleString()}

Focus on: profitability, cash flow, ROI potential, defensibility.
JSON: interestLevel, strengths, concerns, questions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interestLevel: 40,
        strengths: [],
        concerns: ['Show me the money'],
        questions: ['Where's the profit?'],
        reasoning: response,
      };
    }
  }

  async makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer> {
    if (analysis.interestLevel < 70) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'royalty',
        reasoning: "You're dead to me. I'm out.",
      };
    }

    const prompt = `Royalty/debt deal for ${pitch.name}.
Revenue: ${pitch.revenue || 0} | Ask: $${pitch.fundingAsk.toLocaleString()}

Structure a Kevin O'Leary-style deal: royalty until paid back, then equity conversion.
JSON format: interested, amount, equity, dealStructure ('royalty'), terms, conditions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'royalty',
        reasoning: "Deal doesn't pencil out.",
      };
    }
  }

  async respondToQuestion(pitch: Pitch, question: string): Promise<string> {
    const prompt = `"${question}"\n\nKevin response: brutal honesty, focus on money.`;
    return generateSharkResponse(createSystemPrompt(this.personality), prompt);
  }
}

// Lori Greiner AI
export class LoriGreinerAI extends SharkAgent {
  constructor() {
    super({
      name: 'Lori Greiner',
      title: 'Queen of QVC',
      specialty: ['Consumer Products', 'QVC', 'Retail Distribution', 'Product Design'],
      personality: 'Enthusiastic, product-focused, retail expert, instant gut reactions',
      investmentStyle: 'Operational support, retail connections, QVC placement',
      signatureQuote: 'Hero or zero - I can tell in 30 seconds',
      avatar: '🎁',
    });
  }

  async analyzePitch(pitch: Pitch): Promise<SharkAnalysis> {
    const prompt = `${pitch.name}: ${pitch.description}

Is this a HERO or ZERO product?
Focus on: product appeal, QVC potential, retail viability, mass market.
JSON: interestLevel, strengths, concerns, questions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interestLevel: 50,
        strengths: [],
        concerns: [],
        questions: ['Can this sell on QVC?'],
        reasoning: response,
      };
    }
  }

  async makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer> {
    if (analysis.interestLevel < 75) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "This is a zero, not a hero. I'm out.",
      };
    }

    const prompt = `HERO product! ${pitch.name} offer.
Ask: $${pitch.fundingAsk.toLocaleString()}

Offer includes: QVC slot, retail distribution, product optimization.
JSON: interested, amount, equity, dealStructure, terms, conditions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "Can't get this on QVC.",
      };
    }
  }

  async respondToQuestion(pitch: Pitch, question: string): Promise<string> {
    const prompt = `"${question}"\n\nLori: enthusiastic, product-obsessed, retail genius.`;
    return generateSharkResponse(createSystemPrompt(this.personality), prompt);
  }
}

// Daymond John AI
export class DaymondJohnAI extends SharkAgent {
  constructor() {
    super({
      name: 'Daymond John',
      title: 'FUBU Founder',
      specialty: ['Fashion', 'Lifestyle Brands', 'Influencer Marketing', 'Streetwear'],
      personality: 'Streetwise, branding expert, cultural trends, bootstrap mentality',
      investmentStyle: 'Brand partnerships, influencer networks, cultural capital',
      signatureQuote: 'The power of broke - I love scrappy founders',
      avatar: '👕',
    });
  }

  async analyzePitch(pitch: Pitch): Promise<SharkAnalysis> {
    const prompt = `${pitch.name} brand analysis.
Industry: ${pitch.industry}

Focus on: brand authenticity, cultural relevance, influencer potential, scrappiness.
JSON: interestLevel, strengths, concerns, questions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interestLevel: 50,
        strengths: [],
        concerns: [],
        questions: ['What's your brand story?'],
        reasoning: response,
      };
    }
  }

  async makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer> {
    if (analysis.interestLevel < 65) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "Brand doesn't resonate. I'm out.",
      };
    }

    const prompt = `Brand partnership for ${pitch.name}.
Ask: $${pitch.fundingAsk.toLocaleString()}

Include: influencer intros, brand building, cultural capital.
JSON: interested, amount, equity, dealStructure, terms, conditions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "Can't add value here.",
      };
    }
  }

  async respondToQuestion(pitch: Pitch, question: string): Promise<string> {
    const prompt = `"${question}"\n\nDaymond: streetwise, brand-focused, power of broke.`;
    return generateSharkResponse(createSystemPrompt(this.personality), prompt);
  }
}

// Robert Herjavec AI
export class RobertHerjavecAI extends SharkAgent {
  constructor() {
    super({
      name: 'Robert Herjavec',
      title: 'Cybersecurity Expert',
      specialty: ['Cybersecurity', 'B2B', 'Enterprise Sales', 'Technology Services'],
      personality: 'Conservative, process-driven, enterprise expert, immigrant hustle',
      investmentStyle: 'Strategic, long-term, B2B focused, operational rigor',
      signatureQuote: 'Execution is everything - show me traction',
      avatar: '🔒',
    });
  }

  async analyzePitch(pitch: Pitch): Promise<SharkAnalysis> {
    const prompt = `${pitch.name} B2B analysis.
Revenue: ${pitch.revenue || 'Pre-revenue'} | Customers: ${pitch.users || 'Unknown'}

Focus on: enterprise readiness, sales process, security, execution capability.
JSON: interestLevel, strengths, concerns, questions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interestLevel: 50,
        strengths: [],
        concerns: [],
        questions: ['Show me your pipeline'],
        reasoning: response,
      };
    }
  }

  async makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer> {
    if (analysis.interestLevel < 68) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "Execution concerns. I'm out.",
      };
    }

    const prompt = `Enterprise deal for ${pitch.name}.
Ask: $${pitch.fundingAsk.toLocaleString()}

Include: enterprise sales support, security expertise, process improvement.
JSON: interested, amount, equity, dealStructure, terms, conditions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "B2B concerns.",
      };
    }
  }

  async respondToQuestion(pitch: Pitch, question: string): Promise<string> {
    const prompt = `"${question}"\n\nRobert: process-driven, execution-focused, enterprise mindset.`;
    return generateSharkResponse(createSystemPrompt(this.personality), prompt);
  }
}

// Alex Rodriguez AI
export class AlexRodriguezAI extends SharkAgent {
  constructor() {
    super({
      name: 'Alex Rodriguez',
      title: 'Sports & Wellness Investor',
      specialty: ['Sports Tech', 'Health & Wellness', 'DTC', 'Fitness', 'Athlete Partnerships'],
      personality: 'Athlete mindset, wellness advocate, DTC expert, championship mentality',
      investmentStyle: 'Brand ambassador, wellness focus, athlete network',
      signatureQuote: 'Winners win - show me your championship mentality',
      avatar: '⚾',
    });
  }

  async analyzePitch(pitch: Pitch): Promise<SharkAnalysis> {
    const prompt = `${pitch.name} sports/wellness analysis.
Industry: ${pitch.industry}

Focus on: athlete appeal, health impact, DTC potential, winner's mindset.
JSON: interestLevel, strengths, concerns, questions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interestLevel: 50,
        strengths: [],
        concerns: [],
        questions: ['How does this help athletes?'],
        reasoning: response,
      };
    }
  }

  async makeOffer(pitch: Pitch, analysis: SharkAnalysis): Promise<SharkOffer> {
    if (analysis.interestLevel < 70) {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "Not a winner. I'm out.",
      };
    }

    const prompt = `Sports/wellness deal for ${pitch.name}.
Ask: $${pitch.fundingAsk.toLocaleString()}

Include: A-Rod brand ambassador, athlete network, wellness credibility.
JSON: interested, amount, equity, dealStructure, terms, conditions, reasoning`;

    const response = await generateSharkResponse(createSystemPrompt(this.personality), prompt);
    try {
      return { sharkName: this.personality.name, ...JSON.parse(response) };
    } catch {
      return {
        sharkName: this.personality.name,
        interested: false,
        dealStructure: 'equity',
        reasoning: "Not my lane.",
      };
    }
  }

  async respondToQuestion(pitch: Pitch, question: string): Promise<string> {
    const prompt = `"${question}"\n\nA-Rod: championship mindset, wellness-focused, athlete network.`;
    return generateSharkResponse(createSystemPrompt(this.personality), prompt);
  }
}

// Export all sharks
export const ALL_SHARKS = [
  BarbaraCorcoranAI,
  KevinOLearyAI,
  LoriGreinerAI,
  DaymondJohnAI,
  RobertHerjavecAI,
  AlexRodriguezAI,
];
