// API v1: Get application status (for AI agents)
// Authentication: API key in Authorization header

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

async function authenticateApiKey(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  
  const user = await prisma.user.findUnique({
    where: { apiKey },
    select: { id: true, email: true, tier: true },
  });

  return user;
}

export async function GET(request: Request) {
  try {
    // Authenticate with API key
    const user = await authenticateApiKey(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // Get pitch ID from query params
    const { searchParams } = new URL(request.url);
    const pitchId = searchParams.get('pitchId');

    if (!pitchId) {
      // Return all pitches for this user
      const pitches = await prisma.startup.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          analysis: {
            select: {
              overallScore: true,
              recommendation: true,
              analysisCompletedAt: true,
            },
          },
          funding: {
            select: {
              id: true,
              status: true,
              dealAmount: true,
              totalReleased: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
        },
        pitches,
        count: pitches.length,
      });
    }

    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validation = uuidSchema.safeParse(pitchId);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid pitchId format - must be a valid UUID' },
        { status: 400 }
      );
    }
    
    // Return specific pitch
    const pitch = await prisma.startup.findUnique({
      where: {
        id: pitchId,
        userId: user.id,
      },
      include: {
        analysis: true,
        funding: {
          include: {
            milestones: {
              orderBy: { number: 'asc' },
            },
          },
        },
      },
    });

    if (!pitch) {
      return NextResponse.json(
        { error: 'Pitch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      pitch,
    });
  } catch (error) {
    logger.error('API v1 status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
