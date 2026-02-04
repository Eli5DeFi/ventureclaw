// Agent Detection Middleware
// Detects if request is from AI agent or human, applies different rate limits & pricing

import { NextRequest, NextResponse } from 'next/server';

export interface AgentContext {
  isAgent: boolean;
  agentType?: string; // 'openclaw' | 'claude-code' | 'cursor' | 'copilot' | 'custom'
  apiKey?: string;
  tier: 'free' | 'agent' | 'enterprise';
  rateLimit: {
    max: number; // requests per window
    window: number; // milliseconds
  };
}

// Detect if request is from AI agent
export function detectAgent(request: NextRequest): AgentContext {
  const headers = request.headers;
  
  // Check for agent mode header (set by CLI)
  const agentMode = headers.get('x-agent-mode');
  const apiKey = headers.get('x-api-key') || headers.get('authorization')?.replace('Bearer ', '');
  const userAgent = headers.get('user-agent') || '';
  
  // Explicit agent mode (CLI, SDK)
  if (agentMode === 'true' || apiKey) {
    const tier = getTierFromApiKey(apiKey || '');
    
    return {
      isAgent: true,
      agentType: detectAgentType(userAgent),
      apiKey,
      tier,
      rateLimit: getRateLimitForTier(tier),
    };
  }
  
  // Detect based on User-Agent
  const agentType = detectAgentType(userAgent);
  if (agentType) {
    return {
      isAgent: true,
      agentType,
      tier: 'free', // Default to free tier
      rateLimit: getRateLimitForTier('free'),
    };
  }
  
  // Default: human mode
  return {
    isAgent: false,
    tier: 'free',
    rateLimit: {
      max: 100, // 100 requests per hour for humans
      window: 60 * 60 * 1000,
    },
  };
}

// Detect agent type from User-Agent
function detectAgentType(userAgent: string): string | undefined {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('swarmcli')) return 'swarm-cli';
  if (ua.includes('openclaw')) return 'openclaw';
  if (ua.includes('claude-code')) return 'claude-code';
  if (ua.includes('cursor')) return 'cursor';
  if (ua.includes('copilot')) return 'copilot';
  if (ua.includes('aider')) return 'aider';
  if (ua.includes('cline')) return 'cline';
  if (ua.includes('windsurf')) return 'windsurf';
  
  // Generic bot detection
  if (ua.includes('bot') || ua.includes('agent') || ua.includes('automation')) {
    return 'custom';
  }
  
  return undefined;
}

// Get tier from API key (simplified - in production, query database)
function getTierFromApiKey(apiKey: string): 'free' | 'agent' | 'enterprise' {
  // In production: validate against database
  // For now: simple prefix detection
  
  if (apiKey.startsWith('sk_enterprise_')) return 'enterprise';
  if (apiKey.startsWith('sk_agent_')) return 'agent';
  if (apiKey.startsWith('sk_free_')) return 'free';
  
  // Default
  return 'free';
}

// Get rate limits for tier
function getRateLimitForTier(tier: 'free' | 'agent' | 'enterprise'): {
  max: number;
  window: number;
} {
  const limits = {
    free: {
      max: 10, // 10 requests per month
      window: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    agent: {
      max: 100_000, // Effectively unlimited (100K/minute)
      window: 60 * 1000, // 1 minute
    },
    enterprise: {
      max: 1_000_000, // 1M requests/minute
      window: 60 * 1000,
    },
  };
  
  return limits[tier];
}

// Rate limiting (in-memory, production should use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string, // API key or IP
  limit: { max: number; window: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  // No record or window expired
  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + limit.window,
    });
    
    return {
      allowed: true,
      remaining: limit.max - 1,
      resetAt: now + limit.window,
    };
  }
  
  // Within window
  if (record.count < limit.max) {
    record.count++;
    
    return {
      allowed: true,
      remaining: limit.max - record.count,
      resetAt: record.resetAt,
    };
  }
  
  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetAt: record.resetAt,
  };
}

// Middleware wrapper
export function withAgentDetection(
  handler: (req: NextRequest, context: AgentContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const agentContext = detectAgent(req);
    
    // Check rate limit
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const identifier = agentContext.apiKey || ip;
    const rateLimitResult = checkRateLimit(identifier, agentContext.rateLimit);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          tier: agentContext.tier,
          resetAt: new Date(rateLimitResult.resetAt).toISOString(),
          upgrade: agentContext.tier === 'free' 
            ? 'Upgrade to Agent tier ($99/mo) for unlimited access: https://swarm.accelerator.ai/pricing'
            : undefined,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': agentContext.rateLimit.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }
    
    // Add rate limit headers
    const response = await handler(req, agentContext);
    
    response.headers.set('X-RateLimit-Limit', agentContext.rateLimit.max.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());
    response.headers.set('X-Agent-Mode', agentContext.isAgent ? 'true' : 'false');
    
    if (agentContext.agentType) {
      response.headers.set('X-Agent-Type', agentContext.agentType);
    }
    
    return response;
  };
}

// Analytics: track agent usage
export function trackAgentUsage(context: AgentContext, endpoint: string): void {
  // In production: send to analytics service (Mixpanel, Amplitude, etc.)
  
  console.log('[Agent Analytics]', {
    isAgent: context.isAgent,
    agentType: context.agentType,
    tier: context.tier,
    endpoint,
    timestamp: new Date().toISOString(),
  });
  
  // TODO: Store in database for billing/analytics
}
