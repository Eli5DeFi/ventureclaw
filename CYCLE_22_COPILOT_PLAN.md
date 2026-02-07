# Cycle #22: Founder Co-Pilot AI - Implementation Plan

**Date:** February 7, 2026 5:00 PM WIB  
**Type:** Implementation  
**Duration:** ~2 hours  
**Status:** 🏗️ In Progress

---

## 🎯 Mission

Build a 24/7 AI advisor for every funded startup in VentureClaw.

**Value Proposition:**
- Founders get personal AI coach after getting funded
- Proactive monitoring (daily check-ins, milestone tracking)
- Growth advice, technical help, fundraising guidance
- Auto-generated investor updates
- 100x retention impact (founders stay engaged)

---

## 📦 What We'll Build

### 1. Core Features (MVP)

#### A. Chat Interface (`/dashboard/copilot`)
- Real-time chat with AI advisor
- Context-aware (knows startup details, pitch, funding)
- Conversation history stored
- Mobile-responsive

#### B. Co-Pilot Agent (`/lib/agents/copilot-agent.ts`)
- Specialized prompt for founder coaching
- Access to startup context (pitch, analysis, offers)
- Multi-domain expertise:
  - **Growth:** Marketing, sales, product strategy
  - **Technical:** Architecture, code review, hiring
  - **Fundraising:** Pitch improvement, investor intros
  - **Operations:** Legal, accounting, compliance

#### C. Proactive Monitoring
- Daily check-ins (optional, founder can enable/disable)
- Milestone progress tracking
- Alert on important events (offer expiring, meeting scheduled)
- Weekly summary emails

#### D. API Endpoints
- `POST /api/copilot/chat` - Send message, get response
- `GET /api/copilot/history` - Load conversation history
- `POST /api/copilot/settings` - Enable/disable proactive features
- `GET /api/copilot/summary` - Generate weekly summary

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Founder Dashboard                         │
│                  /dashboard/copilot                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Chat Interface (React)                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ Message history                                 │  │  │
│  │  │ Input field                                     │  │  │
│  │  │ Quick actions (Generate update, Ask advice)    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   API Routes                                 │
│                /api/copilot/*                                │
│                                                               │
│  POST /chat        → Send message                            │
│  GET  /history     → Load history                            │
│  POST /settings    → Update preferences                      │
│  GET  /summary     → Weekly summary                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                Co-Pilot Agent Service                        │
│             /lib/agents/copilot-agent.ts                     │
│                                                               │
│  • Load startup context (pitch, offers, milestones)         │
│  • Generate personalized response                            │
│  • Store conversation in DB                                  │
│  • Proactive monitoring (cron jobs)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Database (Prisma)                           │
│                                                               │
│  CopilotMessage {                                            │
│    id, userId, startupId,                                   │
│    role: 'user' | 'assistant',                              │
│    content, timestamp                                        │
│  }                                                            │
│                                                               │
│  CopilotSettings {                                           │
│    userId, proactiveCheckIns,                               │
│    dailyReminders, weeklyUpdates                            │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Database Schema Changes

### New Models

```prisma
model CopilotMessage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  startupId String
  startup   Startup  @relation(fields: [startupId], references: [id])
  
  role      String   // 'user' | 'assistant'
  content   String
  
  createdAt DateTime @default(now())
  
  @@index([startupId, createdAt])
  @@index([userId])
}

model CopilotSettings {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  
  proactiveCheckIns Boolean  @default(true)
  dailyReminders    Boolean  @default(false)
  weeklyUpdates     Boolean  @default(true)
  
  updatedAt         DateTime @updatedAt
}
```

**Note:** Using text fields (not arrays) for SQLite compatibility. Will migrate to proper types when PostgreSQL migration happens.

---

## 🎨 UI Components

### 1. `/dashboard/copilot/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ChatMessage } from '@/components/copilot/ChatMessage';
import { ChatInput } from '@/components/copilot/ChatInput';
import { QuickActions } from '@/components/copilot/QuickActions';

export default function CopilotPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load history
  useEffect(() => {
    fetch('/api/copilot/history')
      .then(res => res.json())
      .then(data => setMessages(data.messages));
  }, []);

  // Send message
  const sendMessage = async (content: string) => {
    setLoading(true);
    const res = await fetch('/api/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content }),
    });
    const data = await res.json();
    setMessages([...messages, 
      { role: 'user', content },
      { role: 'assistant', content: data.response }
    ]);
    setLoading(false);
  };

  return (
    <div className="copilot-container">
      <h1>Your Co-Pilot AI</h1>
      <QuickActions onAction={sendMessage} />
      <div className="messages">
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
      </div>
      <ChatInput onSend={sendMessage} loading={loading} />
    </div>
  );
}
```

---

## 🤖 Co-Pilot Agent Logic

### `/lib/agents/copilot-agent.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';

interface CopilotContext {
  startup: any;
  pitch: any;
  offers: any[];
  user: any;
}

export class CopilotAgent {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(userId: string, startupId: string, message: string): Promise<string> {
    // 1. Load context
    const context = await this.loadContext(userId, startupId);
    
    // 2. Load conversation history
    const history = await prisma.copilotMessage.findMany({
      where: { userId, startupId },
      orderBy: { createdAt: 'asc' },
      take: 20, // Last 20 messages
    });

    // 3. Build prompt
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = [
      ...history.map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // 4. Call Claude
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // 5. Store messages
    await this.storeMessages(userId, startupId, message, reply);

    return reply;
  }

  private buildSystemPrompt(context: CopilotContext): string {
    return `You are the Founder Co-Pilot AI for VentureClaw, a personal advisor for ${context.user.name}.

**Your Role:**
- 24/7 AI advisor and coach
- Help with growth, technical, fundraising, and operations
- Proactive monitoring and check-ins
- Generate investor updates
- Celebrate wins, support through challenges

**Startup Context:**
- Name: ${context.startup.name}
- Industry: ${context.pitch?.industry || 'N/A'}
- Stage: ${context.pitch?.stage || 'Early'}
- Funding Raised: $${context.offers.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
- Description: ${context.startup.description}

**Pitch Summary:**
${context.pitch?.problemStatement || 'No pitch yet'}

**Your Expertise:**
1. **Growth:** Marketing, sales, product-market fit, retention
2. **Technical:** Architecture, hiring engineers, code review
3. **Fundraising:** Pitch improvement, investor intros, term sheets
4. **Operations:** Legal, accounting, compliance, team management

**Tone:**
- Supportive but honest
- Data-driven, not fluffy
- Celebrate wins, empathize with struggles
- Proactive suggestions when appropriate

**Guidelines:**
- Keep responses concise (2-4 paragraphs max)
- Ask clarifying questions when needed
- Suggest actionable next steps
- Reference relevant resources (articles, tools, people)
- If you don't know, say so and suggest where to find answers

Now, respond to the founder's message below.`;
  }

  private async loadContext(userId: string, startupId: string): Promise<CopilotContext> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    const pitch = await prisma.pitch.findFirst({
      where: { userId, startupId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Get offers (using on-demand generation from Cycle #20)
    const { getOffersForPitch } = await import('@/lib/services/investment-offers');
    const offers = pitch ? await getOffersForPitch(pitch.id) : [];

    return { user, startup, pitch, offers };
  }

  private async storeMessages(
    userId: string, 
    startupId: string, 
    userMessage: string, 
    assistantReply: string
  ) {
    await prisma.copilotMessage.createMany({
      data: [
        { userId, startupId, role: 'user', content: userMessage },
        { userId, startupId, role: 'assistant', content: assistantReply },
      ],
    });
  }

  // Proactive features
  async generateDailyCheckIn(userId: string, startupId: string): Promise<string> {
    const context = await this.loadContext(userId, startupId);
    
    const prompt = `Generate a brief, friendly check-in message for ${context.user.name}.
    
Ask about:
- Progress since yesterday
- Any blockers or challenges
- What they're working on today

Keep it casual (2-3 sentences) and specific to their startup (${context.startup.name}).`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Cheaper model for check-ins
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async generateInvestorUpdate(userId: string, startupId: string): Promise<string> {
    const context = await this.loadContext(userId, startupId);
    
    // Get recent conversation for context
    const recentMessages = await prisma.copilotMessage.findMany({
      where: { userId, startupId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: 'asc' },
    });

    const conversationSummary = recentMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `Generate a professional investor update email for ${context.startup.name}.

**Context from this week's conversations:**
${conversationSummary}

**Format:**
1. Key Metrics (revenue, users, etc. if mentioned)
2. Wins (accomplishments, milestones)
3. Challenges (blockers, needs)
4. Next Steps (what's coming this week)

Keep it concise, data-driven, and honest. Include specific numbers when available.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }
}
```

---

## 🚀 Implementation Steps

### Phase 1: Core Chat (60 min)
1. ✅ Create implementation plan (this doc)
2. ⏳ Add Prisma schema (CopilotMessage, CopilotSettings)
3. ⏳ Build CopilotAgent service
4. ⏳ Add `/api/copilot/chat` endpoint
5. ⏳ Add `/api/copilot/history` endpoint
6. ⏳ Build UI components (ChatMessage, ChatInput)
7. ⏳ Create `/dashboard/copilot` page
8. ⏳ Test conversation flow

### Phase 2: Quick Actions (30 min)
9. ⏳ Add QuickActions component (Generate update, Ask advice)
10. ⏳ Add `/api/copilot/summary` endpoint
11. ⏳ Test quick actions

### Phase 3: Proactive Features (30 min)
12. ⏳ Add CopilotSettings model
13. ⏳ Add `/api/copilot/settings` endpoint
14. ⏳ Add settings UI to copilot page
15. ⏳ Add daily check-in cron job (optional, document for future)

---

## ✅ Success Criteria

- [ ] Founders can chat with Co-Pilot AI
- [ ] Conversation history persists
- [ ] Co-Pilot has context about startup
- [ ] Quick actions work (generate update)
- [ ] UI is clean and responsive
- [ ] All tests pass
- [ ] Documentation updated

---

## 📊 Expected Impact

**Metrics to Track:**
- Daily active users (founders using co-pilot)
- Messages per founder (engagement)
- Investor update generation rate
- Founder satisfaction (NPS)

**Success Targets (Month 1):**
- 50%+ of funded founders use co-pilot weekly
- Avg 10+ messages per founder
- 80%+ satisfaction score

---

## 🔗 Future Enhancements (Post-MVP)

1. **Voice Chat** - Audio interface for mobile
2. **Milestone Tracking** - Integrate with KPI Oracle
3. **Team Chat** - Multi-user conversations
4. **Investor Portal** - Investors can see updates
5. **Integration Hooks** - Slack, Discord, WhatsApp
6. **Advanced Prompts** - Specialized agents (growth, tech, fundraising)
7. **RAG Integration** - Search docs, playbooks, best practices

---

**Status:** 🏗️ Starting Implementation  
**ETA:** 2 hours  
**Next:** Add Prisma schema
