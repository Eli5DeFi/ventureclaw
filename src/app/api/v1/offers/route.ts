// API v1: List investment offers (for AI agents)
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
    select: { id: true },
  });

  return user;
}

export async function GET(request: Request) {
  try {
    const user = await authenticateApiKey(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pitchId = searchParams.get('pitchId');

    if (!pitchId) {
      return NextResponse.json(
        { error: 'pitchId query parameter required' },
        { status: 400 }
      );
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

    // Verify pitch belongs to user
    const pitch = await prisma.startup.findUnique({
      where: {
        id: pitchId,
        userId: user.id,
      },
      include: {
        analysis: true,
        funding: true,
      },
    });

    if (!pitch) {
      return NextResponse.json(
        { error: 'Pitch not found' },
        { status: 404 }
      );
    }

    if (pitch.funding) {
      return NextResponse.json({
        offers: [],
        message: 'Funding already accepted for this pitch',
        fundingId: pitch.funding.id,
      });
    }

    // TODO: Fetch real offers
    // For now, generate mock offers based on analysis
    const offers = [];
    if (pitch.analysis && pitch.analysis.recommendation === 'APPROVED') {
      offers.push({
        id: 'offer_1',
        pitchId: pitch.id,
        amount: Math.floor(pitch.fundingAsk * 0.8),
        equity: 15,
        dealType: 'SAFE',
        terms: '5M cap, 20% discount',
        investor: 'AI Ventures',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      
      if (pitch.analysis.overallScore >= 85) {
        offers.push({
          id: 'offer_2',
          pitchId: pitch.id,
          amount: pitch.fundingAsk,
          equity: 20,
          dealType: 'Equity',
          terms: 'Priced round at $5M post-money',
          investor: 'Sequoia Capital',
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    return NextResponse.json({
      pitchId: pitch.id,
      pitchName: pitch.name,
      offers,
      count: offers.length,
    });
  } catch (error) {
    logger.error('API v1 offers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
