/**
 * API route to accept funding offer and create funding record with milestones
 * 
 * @route POST /api/dashboard/pitch/[id]/accept-funding
 * @auth Required (session-based)
 * @body { offerId: string }
 * @returns Created funding record with milestones
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getOfferById, acceptOffer } from '@/lib/services/investment-offers';

// Validation schema for offer acceptance
const AcceptOfferSchema = z.object({
  offerId: z.string().min(1, 'Offer ID is required'),
});

// UUID validation for pitch ID
const PitchIdSchema = z.string().uuid('Invalid pitch ID format');

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = await params;

    // Validate pitch ID format
    const pitchIdValidation = PitchIdSchema.safeParse(id);
    if (!pitchIdValidation.success) {
      return NextResponse.json(
        { error: 'Invalid pitch ID format' },
        { status: 400 }
      );
    }

    // Validate offer ID
    const offerValidation = AcceptOfferSchema.safeParse(body);
    if (!offerValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid offer ID',
          details: offerValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const { offerId } = offerValidation.data;

    // Verify pitch exists and belongs to user
    const pitch = await prisma.startup.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        funding: true,
      },
    });

    if (!pitch) {
      return NextResponse.json({ error: 'Pitch not found' }, { status: 404 });
    }

    if (pitch.funding) {
      return NextResponse.json(
        { error: 'Funding already accepted for this pitch' },
        { status: 400 }
      );
    }

    // Get real offer details
    const offer = await getOfferById(pitch.id, offerId);

    if (!offer) {
      return NextResponse.json({ error: 'Invalid offer ID or offer not found' }, { status: 400 });
    }

    if (offer.status !== 'active') {
      return NextResponse.json({ error: 'Offer is no longer active' }, { status: 400 });
    }

    // Check if offer has expired
    const now = new Date();
    if (new Date(offer.expiresAt) < now) {
      return NextResponse.json({ error: 'Offer has expired' }, { status: 400 });
    }
    
    // Mark offer as accepted
    await acceptOffer(pitch.id, offerId);
    
    const offerData = {
      amount: offer.offerAmount,
      equity: offer.equity,
      dealType: offer.dealType,
    };

    // Create funding record with 5 milestones over 12 months
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
              description: 'Initial product development and team setup',
              amount: Math.floor(offerData.amount * 0.2), // 20%
              dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // +2 months
              status: 'pending',
            },
            {
              number: 2,
              description: 'MVP launch and first customer acquisition',
              amount: Math.floor(offerData.amount * 0.2), // 20%
              dueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000), // +4 months
              status: 'pending',
            },
            {
              number: 3,
              description: 'Achieve product-market fit and scaling',
              amount: Math.floor(offerData.amount * 0.25), // 25%
              dueDate: new Date(now.getTime() + 210 * 24 * 60 * 60 * 1000), // +7 months
              status: 'pending',
            },
            {
              number: 4,
              description: 'Revenue growth and market expansion',
              amount: Math.floor(offerData.amount * 0.2), // 20%
              dueDate: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000), // +10 months
              status: 'pending',
            },
            {
              number: 5,
              description: 'Final milestone and next fundraising round',
              amount: Math.floor(offerData.amount * 0.15), // 15%
              dueDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // +12 months
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
      message: 'Funding accepted successfully',
      fundingId: funding.id,
      funding,
    });
  } catch (error) {
    logger.error('Failed to accept funding:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Pitch not found or access denied' },
          { status: 404 }
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Funding already accepted for this pitch' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to accept funding offer. Please try again.' },
      { status: 500 }
    );
  }
}
