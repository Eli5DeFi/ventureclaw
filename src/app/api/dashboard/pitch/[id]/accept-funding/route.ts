// API route to accept funding offer and create funding record with milestones

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { offerId } = await request.json();

    // Verify pitch exists and belongs to user
    const pitch = await prisma.startup.findUnique({
      where: {
        id: params.id,
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

    // TODO: Fetch real offer details
    // For now, use mock offer data
    const offerData = {
      offer_1: { amount: Math.floor(pitch.fundingAsk * 0.8), equity: 15, dealType: 'SAFE' },
      offer_2: { amount: pitch.fundingAsk, equity: 20, dealType: 'Equity' },
    }[offerId];

    if (!offerData) {
      return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });
    }

    // Create funding record with 5 milestones over 12 months
    const now = new Date();
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
      message: 'Funding accepted successfully',
      fundingId: funding.id,
      funding,
    });
  } catch (error) {
    console.error('Failed to accept funding:', error);
    return NextResponse.json(
      { error: 'Failed to accept funding offer' },
      { status: 500 }
    );
  }
}
