// API route to fetch pitch details

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getOffersForPitch } from '@/lib/services/investment-offers';

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

    const pitch = await prisma.startup.findUnique({
      where: {
        id,
        userId: session.user.id, // Ensure user owns this pitch
      },
      include: {
        analysis: true,
        funding: {
          include: {
            milestones: {
              orderBy: {
                number: 'asc',
              },
            },
          },
        },
      },
    });

    if (!pitch) {
      return NextResponse.json({ error: 'Pitch not found' }, { status: 404 });
    }

    // Get real investment offers
    const rawOffers = await getOffersForPitch(pitch.id);
    
    // Transform to dashboard format (simplified for UI)
    const offers = rawOffers.map(offer => ({
      id: offer.id,
      amount: offer.offerAmount,
      equity: offer.equity,
      dealType: offer.dealType,
      terms: offer.terms,
      investor: offer.investor,
      investorType: offer.investorType,
      expiresAt: offer.expiresAt,
    }));

    return NextResponse.json({
      pitch,
      offers,
    });
  } catch (error) {
    logger.error('Failed to fetch pitch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pitch details' },
      { status: 500 }
    );
  }
}
