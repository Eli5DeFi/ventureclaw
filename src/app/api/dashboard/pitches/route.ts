// API route to fetch user's pitches/startups

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCache } from '@/lib/cache';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cache per-user data for 1 minute (balance freshness vs performance)
    const cacheKey = `user-pitches-${session.user.id}`;
    
    const result = await withCache(
      cacheKey,
      async () => {
        // Fetch user's pitches with related data
        const pitches = await prisma.startup.findMany({
          where: {
            userId: session.user.id,
          },
          include: {
            analysis: {
              select: {
                overallScore: true,
                recommendation: true,
                analysisCompletedAt: true,
                financialScore: true,
                technicalScore: true,
                marketScore: true,
                legalScore: true,
              },
            },
            funding: {
              select: {
                id: true,
                dealAmount: true,
                equityPercent: true,
                dealType: true,
                status: true,
                totalReleased: true,
                acceptedAt: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          pitches,
          count: pitches.length,
        };
      },
      60 * 1000 // 1 minute TTL
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch pitches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pitches' },
      { status: 500 }
    );
  }
}
