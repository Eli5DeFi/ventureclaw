// API v1: Accept funding offer (for AI agents)
// Authentication: API key in Authorization header

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getOfferById, acceptOffer } from '@/lib/services/investment-offers';

/**
 * Validation schema for accepting funding offers
 */
const AcceptFundingSchema = z.object({
  pitchId: z.string().uuid('Invalid pitch ID format'),
  offerId: z.string().min(1, 'Offer ID is required'),
});

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

export async function POST(request: Request) {
  try {
    const user = await authenticateApiKey(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = AcceptFundingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        },
        { status: 400 }
      );
    }
    
    const { pitchId, offerId } = validation.data;

    // Verify pitch belongs to user
    const pitch = await prisma.startup.findUnique({
      where: {
        id: pitchId,
        userId: user.id,
      },
      include: {
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
      return NextResponse.json(
        { error: 'Funding already accepted', fundingId: pitch.funding.id },
        { status: 400 }
      );
    }

    // Get real offer details
    const offer = await getOfferById(pitchId, offerId);

    if (!offer) {
      return NextResponse.json(
        { error: 'Invalid offer ID or offer not found' },
        { status: 400 }
      );
    }

    if (offer.status !== 'active') {
      return NextResponse.json(
        { error: 'Offer is no longer active' },
        { status: 400 }
      );
    }

    // Check if offer has expired
    const now = new Date();
    if (new Date(offer.expiresAt) < now) {
      return NextResponse.json(
        { error: 'Offer has expired' },
        { status: 400 }
      );
    }

    // Mark offer as accepted
    await acceptOffer(pitchId, offerId);

    const offerData = {
      amount: offer.offerAmount,
      equity: offer.equity,
      dealType: offer.dealType,
    };

    // Create funding with milestones
    const funding = await prisma.funding.create({
      data: {
        startupId: pitch.id,
        dealAmount: offerData.amount,
        equityPercent: offerData.equity,
        dealType: offerData.dealType,
        acceptedAt: now,
        status: 'active',
        milestones: {
          create: [
            {
              number: 1,
              description: 'Initial product development',
              amount: Math.floor(offerData.amount * 0.2),
              dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
            {
              number: 2,
              description: 'MVP launch',
              amount: Math.floor(offerData.amount * 0.2),
              dueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
            {
              number: 3,
              description: 'Product-market fit',
              amount: Math.floor(offerData.amount * 0.25),
              dueDate: new Date(now.getTime() + 210 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
            {
              number: 4,
              description: 'Revenue growth',
              amount: Math.floor(offerData.amount * 0.2),
              dueDate: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
            {
              number: 5,
              description: 'Next round preparation',
              amount: Math.floor(offerData.amount * 0.15),
              dueDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
              status: 'pending',
            },
          ],
        },
      },
      include: {
        milestones: true,
      },
    });

    // Update pitch status
    await prisma.startup.update({
      where: { id: pitch.id },
      data: { status: 'FUNDED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Funding offer accepted successfully',
      funding: {
        id: funding.id,
        dealAmount: funding.dealAmount,
        equityPercent: funding.equityPercent,
        dealType: funding.dealType,
        milestones: funding.milestones,
      },
    });
  } catch (error) {
    logger.error('API v1 accept error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
