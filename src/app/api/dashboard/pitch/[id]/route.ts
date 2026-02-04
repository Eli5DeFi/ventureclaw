// API route to fetch pitch details

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pitch = await prisma.startup.findUnique({
      where: {
        id: params.id,
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

    // TODO: Fetch real investment offers
    // For now, generate mock offers based on analysis
    const offers = [];
    if (pitch.analysis && pitch.analysis.recommendation === 'APPROVED' && !pitch.funding) {
      offers.push({
        id: 'offer_1',
        amount: Math.floor(pitch.fundingAsk * 0.8), // 80% of ask
        equity: 15,
        dealType: 'SAFE',
        terms: '5M cap, 20% discount. No board seat. Information rights included.',
      });
      
      if (pitch.analysis.overallScore >= 85) {
        offers.push({
          id: 'offer_2',
          amount: pitch.fundingAsk, // Full ask
          equity: 20,
          dealType: 'Equity',
          terms: 'Priced round at $5M post-money. Board observer seat. Quarterly reporting.',
        });
      }
    }

    return NextResponse.json({
      pitch,
      offers,
    });
  } catch (error) {
    console.error('Failed to fetch pitch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pitch details' },
      { status: 500 }
    );
  }
}
