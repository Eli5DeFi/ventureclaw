// API route to fetch funding details

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const funding = await prisma.funding.findUnique({
      where: {
        id,
      },
      include: {
        startup: {
          select: {
            id: true,
            name: true,
            tagline: true,
            userId: true,
          },
        },
        milestones: {
          orderBy: {
            number: 'asc',
          },
        },
      },
    });

    if (!funding) {
      return NextResponse.json({ error: 'Funding not found' }, { status: 404 });
    }

    // Ensure user owns this funding
    if (funding.startup.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      funding,
    });
  } catch (error) {
    logger.error('Failed to fetch funding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding details' },
      { status: 500 }
    );
  }
}
