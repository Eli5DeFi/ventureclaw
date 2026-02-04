// API v1: Get funding details (for AI agents)
// Authentication: API key in Authorization header

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const fundingId = searchParams.get('fundingId');
    const pitchId = searchParams.get('pitchId');

    if (!fundingId && !pitchId) {
      return NextResponse.json(
        { error: 'fundingId or pitchId query parameter required' },
        { status: 400 }
      );
    }

    let funding;

    if (fundingId) {
      funding = await prisma.funding.findUnique({
        where: { id: fundingId },
        include: {
          startup: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
          milestones: {
            orderBy: { number: 'asc' },
          },
        },
      });

      if (!funding || funding.startup.userId !== user.id) {
        return NextResponse.json(
          { error: 'Funding not found' },
          { status: 404 }
        );
      }
    } else {
      // Find funding by pitch ID
      const pitch = await prisma.startup.findUnique({
        where: {
          id: pitchId!,
          userId: user.id,
        },
        include: {
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

      if (!pitch.funding) {
        return NextResponse.json(
          { error: 'No funding found for this pitch' },
          { status: 404 }
        );
      }

      funding = pitch.funding;
    }

    // Calculate progress
    const completedMilestones = funding.milestones.filter(
      m => m.status === 'completed' || m.status === 'verified'
    ).length;
    const totalMilestones = funding.milestones.length;
    const progressPercent = (completedMilestones / totalMilestones) * 100;

    return NextResponse.json({
      funding: {
        id: funding.id,
        dealAmount: funding.dealAmount,
        equityPercent: funding.equityPercent,
        dealType: funding.dealType,
        status: funding.status,
        totalReleased: funding.totalReleased,
        acceptedAt: funding.acceptedAt,
        progress: {
          completedMilestones,
          totalMilestones,
          progressPercent: Math.round(progressPercent),
        },
        milestones: funding.milestones.map(m => ({
          id: m.id,
          number: m.number,
          description: m.description,
          amount: m.amount,
          dueDate: m.dueDate,
          status: m.status,
          completedAt: m.completedAt,
          verifiedAt: m.verifiedAt,
          txHash: m.txHash,
        })),
      },
    });
  } catch (error) {
    console.error('API v1 funding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
