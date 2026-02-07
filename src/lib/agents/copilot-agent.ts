/**
 * Founder Co-Pilot AI Agent
 * 
 * Provides 24/7 personalized coaching and advice for funded startups.
 * 
 * Features:
 * - Context-aware conversations (knows startup details, pitch, funding)
 * - Multi-domain expertise (growth, technical, fundraising, operations)
 * - Proactive monitoring and check-ins
 * - Auto-generated investor updates
 * 
 * Uses existing Message model with agentType='COPILOT' (no schema changes needed).
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface CopilotContext {
  startup: any;
  pitch: any;
  offers: any[];
  user: any;
}

export class CopilotAgent {
  private anthropic: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required for CopilotAgent');
    }
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Main chat function - handles a founder's message and returns AI response
   */
  async chat(userId: string, startupId: string, message: string): Promise<string> {
    logger.info(`CopilotAgent: Processing message for user=${userId} startup=${startupId}`);

    try {
      // 1. Load context about the startup
      const context = await this.loadContext(userId, startupId);
      
      // 2. Load conversation history (last 20 messages)
      const history = await prisma.message.findMany({
        where: { 
          startupId, 
          agentType: 'COPILOT' as any // TODO: Update after enum migration
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      // 3. Build system prompt with startup context
      const systemPrompt = this.buildSystemPrompt(context);
      
      // 4. Format messages for Claude
      const messages: Anthropic.MessageParam[] = [
        ...history.map(h => ({
          role: h.role.toLowerCase() as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user' as const, content: message },
      ];

      // 5. Call Claude Sonnet
      logger.info(`CopilotAgent: Calling Claude with ${messages.length} messages`);
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages,
      });

      const reply = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';

      // 6. Store both messages in DB
      await this.storeMessages(userId, startupId, message, reply);

      logger.info(`CopilotAgent: Successfully generated response (${reply.length} chars)`);
      return reply;

    } catch (error) {
      logger.error('CopilotAgent: Error in chat()', error);
      throw error;
    }
  }

  /**
   * Build system prompt with startup-specific context
   */
  private buildSystemPrompt(context: CopilotContext): string {
    const founderName = context.user?.name || 'there';
    const startupName = context.startup?.name || 'your startup';
    const industry = context.startup?.industry || 'N/A';
    const stage = context.startup?.stage || 'Early';
    const totalFunding = context.offers.reduce((sum, o) => sum + o.amount, 0);
    const problemStatement = context.startup?.description || 'No details available yet';

    return `You are the Founder Co-Pilot AI for VentureClaw, a personal advisor for ${founderName}.

**Your Role:**
- 24/7 AI advisor and coach
- Help with growth, technical, fundraising, and operations challenges
- Proactive monitoring and check-ins
- Generate investor updates
- Celebrate wins, support through challenges

**Startup Context:**
- Name: ${startupName}
- Industry: ${industry}
- Stage: ${stage}
- Total Funding: $${totalFunding.toLocaleString()}
- Description: ${context.startup?.description || 'N/A'}

**Pitch Summary:**
${problemStatement}

**Your Expertise:**
1. **Growth:** Marketing, sales, product-market fit, retention strategies
2. **Technical:** Architecture, hiring engineers, code review, scaling infrastructure
3. **Fundraising:** Pitch improvement, investor intros, term sheet negotiation
4. **Operations:** Legal, accounting, compliance, team management

**Tone & Style:**
- Supportive but honest (tell it like it is)
- Data-driven, not fluffy motivational speak
- Celebrate wins genuinely, empathize with struggles
- Proactive suggestions when appropriate (not pushy)
- Use founder's name occasionally to personalize

**Guidelines:**
- Keep responses concise (2-4 paragraphs max unless asked for detail)
- Ask clarifying questions when context is missing
- Suggest actionable next steps (not vague advice)
- Reference relevant resources (articles, tools, people to talk to)
- If you don't know something, admit it and suggest where to find answers
- Focus on practical, tactical advice over theory

**Examples of Good Responses:**
- "Hey ${founderName}, congrats on hitting that milestone! 🎉 For your next sprint, I'd focus on..."
- "That's a tough spot. Here's what similar startups did..."
- "Quick thought: have you considered [specific tactic]? I've seen it work well for [similar case]..."

Now, respond to ${founderName}'s message below.`;
  }

  /**
   * Load all relevant context about the startup and founder
   */
  private async loadContext(userId: string, startupId: string): Promise<CopilotContext> {
    const [user, startup] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.startup.findUnique({ 
        where: { id: startupId },
        include: { analysis: true } // Include analysis to get offers
      }),
    ]);
    
    // Get offers using the on-demand generation from Cycle #20
    let offers: any[] = [];
    if (startup?.analysis) {
      try {
        const { getOffersForPitch } = await import('@/lib/services/investment-offers');
        offers = await getOffersForPitch(startup.analysis.id);
      } catch (error) {
        logger.error('CopilotAgent: Failed to load offers', error);
      }
    }

    // Startup contains pitch data directly (no separate pitch table)
    return { user, startup, pitch: startup, offers };
  }

  /**
   * Store user message and assistant reply in database
   */
  private async storeMessages(
    userId: string, 
    startupId: string, 
    userMessage: string, 
    assistantReply: string
  ): Promise<void> {
    await prisma.message.createMany({
      data: [
        {
          startupId,
          role: 'USER',
          content: userMessage,
          agentType: 'COPILOT' as any, // TODO: Update after enum migration
          metadata: { userId }, // Track which user sent it
        },
        {
          startupId,
          role: 'ASSISTANT',
          content: assistantReply,
          agentType: 'COPILOT' as any,
          metadata: { userId },
        },
      ],
    });
  }

  /**
   * Generate a friendly daily check-in message
   */
  async generateDailyCheckIn(userId: string, startupId: string): Promise<string> {
    const context = await this.loadContext(userId, startupId);
    const founderName = context.user?.name || 'there';
    const startupName = context.startup?.name || 'your startup';
    
    const prompt = `Generate a brief, friendly check-in message for ${founderName} (founder of ${startupName}).
    
Ask about:
- Progress since yesterday
- Any blockers or challenges  
- What they're working on today

Keep it casual (2-3 sentences max) and specific to their startup. Make it feel personal, not robotic.

Example tone: "Morning! How's the new feature coming along? Hit any roadblocks with the API integration?"`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Cheaper model for check-ins
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      logger.error('CopilotAgent: Error generating check-in', error);
      return `Hey ${founderName}! Quick check-in – how's everything going with ${startupName} today?`;
    }
  }

  /**
   * Generate a professional investor update email
   */
  async generateInvestorUpdate(userId: string, startupId: string): Promise<string> {
    const context = await this.loadContext(userId, startupId);
    
    // Get recent conversation for context
    const recentMessages = await prisma.message.findMany({
      where: { 
        startupId, 
        agentType: 'COPILOT' as any,
        createdAt: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 50, // Limit to avoid token overflow
    });

    const conversationSummary = recentMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const startupName = context.startup?.name || 'Startup';

    const prompt = `Generate a professional investor update email for ${startupName}.

**Context from this week's conversations with the founder:**
${conversationSummary || 'No recent conversations recorded.'}

**Format:**
Subject: ${startupName} Weekly Update - [Date]

Hi team,

1. **Key Metrics** (revenue, users, etc. if mentioned)
   - List specific numbers when available
   
2. **Wins** (accomplishments, milestones)
   - Be specific and quantify when possible
   
3. **Challenges** (blockers, needs)
   - Be honest about what's not working
   
4. **Next Week** (priorities, goals)
   - Clear action items

Best,
[Founder Name]

**Guidelines:**
- Keep it concise (4-6 paragraphs max)
- Be data-driven (use numbers from conversations)
- Be honest (good investors value transparency)
- Avoid fluff and buzzwords
- If no metrics mentioned, acknowledge that and focus on progress narrative`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      logger.error('CopilotAgent: Error generating investor update', error);
      return 'Failed to generate investor update. Please try again.';
    }
  }

  /**
   * Load conversation history (for API endpoints)
   */
  async getHistory(startupId: string, limit: number = 50): Promise<any[]> {
    return prisma.message.findMany({
      where: { 
        startupId, 
        agentType: 'COPILOT' as any 
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}
