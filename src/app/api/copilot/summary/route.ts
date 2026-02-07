/**
 * POST /api/copilot/summary
 * 
 * Generate an investor update email based on recent conversations
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
    const { startupId } = body;

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

    // 5. Generate investor update
    const copilot = new CopilotAgent();
    logger.info(`Generating investor update: user=${user.id} startup=${startupId}`);
    const update = await copilot.generateInvestorUpdate(user.id, startupId);

    // 6. Return update
    return NextResponse.json({
      success: true,
      update,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Error in /api/copilot/summary:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
