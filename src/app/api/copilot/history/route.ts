/**
 * GET /api/copilot/history?startupId=xxx&limit=50
 * 
 * Load conversation history for a startup
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CopilotAgent } from '@/lib/agents/copilot-agent';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get('startupId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!startupId) {
      return NextResponse.json(
        { error: 'startupId query parameter is required' },
        { status: 400 }
      );
    }

    // 4. Verify user owns this startup
    const startup = await prisma.startup.findFirst({
      where: {
        id: startupId,
        userId: user.id,
      },
    });

    if (!startup) {
      return NextResponse.json(
        { error: 'Startup not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Load history
    const copilot = new CopilotAgent();
    const messages = await copilot.getHistory(startupId, limit);

    // 6. Return messages
    return NextResponse.json({
      success: true,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role.toLowerCase(),
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      })),
      count: messages.length,
    });

  } catch (error) {
    logger.error('Error in /api/copilot/history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
