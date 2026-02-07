/**
 * POST /api/copilot/chat
 * 
 * Send a message to the Founder Co-Pilot and get AI response
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CopilotAgent } from '@/lib/agents/copilot-agent';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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

    // 3. Parse request body
    const body = await req.json();
    const { message, startupId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!startupId || typeof startupId !== 'string') {
      return NextResponse.json(
        { error: 'startupId is required' },
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

    // 5. Initialize Co-Pilot agent
    const copilot = new CopilotAgent();

    // 6. Generate response
    logger.info(`Co-Pilot chat: user=${user.id} startup=${startupId}`);
    const response = await copilot.chat(user.id, startupId, message);

    // 7. Return response
    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Error in /api/copilot/chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
