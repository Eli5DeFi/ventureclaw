// API v1: List investment offers (for AI agents)
// Authentication: API key in Authorization header

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getOffersForPitch } from '@/lib/services/investment-offers';

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

    // Get real investment offers
    const offers = await getOffersForPitch(pitchId);

    // Transform to API format (rename fields for consistency)
    const apiOffers = offers.map(offer => ({
      id: offer.id,
      pitchId: offer.pitchId,
      amount: offer.offerAmount,
      equity: offer.equity,
      dealType: offer.dealType,
      terms: offer.terms,
      investor: offer.investor,
      investorType: offer.investorType,
      expiresAt: offer.expiresAt,
      status: offer.status,
    }));

    return NextResponse.json({
      pitchId: pitch.id,
      pitchName: pitch.name,
      offers: apiOffers,
      count: apiOffers.length,
    });
  } catch (error) {
    logger.error('API v1 offers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
