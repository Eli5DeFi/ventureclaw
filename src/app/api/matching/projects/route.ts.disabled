// API: Submit project for funding + run matching
// POST /api/matching/projects - Create project and match to investors

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeProject, matchProjectToInvestors } from '@/lib/agents/matching/project-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = [
      'name',
      'industry',
      'stage',
      'fundingType',
      'amountSeeking',
      'problem',
      'solution',
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Analyze project with AI
    console.log('[Matching] Analyzing project:', body.name);
    const profile = await analyzeProject(body);

    // Create project in database
    const project = await prisma.project.create({
      data: {
        name: profile.name,
        tagline: body.tagline || '',
        description: body.description || '',
        industry: profile.industry,
        stage: profile.stage,
        fundingType: profile.fundingType.toUpperCase() as any,
        amountSeeking: profile.amountSeeking,
        valuation: profile.valuation || null,
        tokenPrice: profile.tokenPrice || null,
        minTicketSize: profile.minTicketSize || 0,
        maxTicketSize: profile.maxTicketSize || profile.amountSeeking,
        revenue: profile.revenue,
        revenueGrowth: profile.revenueGrowth,
        customers: profile.customers,
        teamSize: profile.teamSize,
        problem: profile.problem,
        solution: profile.solution,
        traction: profile.traction,
        moat: profile.moat,
        geography: profile.geography,
        investmentThesis: profile.investmentThesis,
        keyRisks: profile.keyRisks,
        keyOpportunities: profile.keyOpportunities,
        comparables: profile.comparables,
        exitScenarios: profile.exitScenarios,
        idealInvestorTypes: profile.idealInvestorType,
        status: 'OPEN',
      },
    });

    console.log('[Matching] Project created:', project.id);

    // Get all active investors
    const investors = await prisma.investor.findMany({
      where: { active: true },
    });

    console.log(`[Matching] Matching against ${investors.length} investors...`);

    // Match to investors
    const investorProfiles = investors.map((inv) => ({
      id: inv.id,
      name: inv.name,
      type: inv.type.toLowerCase() as any,
      focusAreas: inv.focusAreas,
      stagePreference: inv.stagePreference,
      checkSize: {
        min: Number(inv.checkSizeMin),
        max: Number(inv.checkSizeMax),
      },
      geography: inv.geography,
      fundingTypes: inv.fundingTypes.map((ft) => ft.toLowerCase()) as any,
      riskTolerance: inv.riskTolerance.toLowerCase() as any,
      timeHorizon: inv.timeHorizon,
      investmentThesis: inv.investmentThesis,
      priorities: inv.priorities,
      dealBreakers: inv.dealBreakers,
      portfolioCompanies: inv.portfolioCompanies,
      recentInvestments: [],
      createdAt: inv.createdAt,
      active: inv.active,
    }));

    const matches = await matchProjectToInvestors(profile, investorProfiles);

    // Save matches to database (only top 20, score > 50)
    const topMatches = matches.filter((m) => m.score.overall >= 50).slice(0, 20);

    for (const match of topMatches) {
      await prisma.match.create({
        data: {
          projectId: project.id,
          investorId: match.investor.id,
          overallScore: match.score.overall,
          industryFit: match.score.breakdown.industryFit,
          stageFit: match.score.breakdown.stageFit,
          ticketSizeFit: match.score.breakdown.ticketSizeFit,
          geographyFit: match.score.breakdown.geographyFit,
          fundingTypeFit: match.score.breakdown.fundingTypeFit,
          thesisFit: match.score.breakdown.thesisFit,
          reasoning: match.score.reasoning,
          synergies: match.score.synergies,
          concerns: match.score.concerns,
          status: 'PENDING',
        },
      });
    }

    console.log(`[Matching] Created ${topMatches.length} matches`);

    return NextResponse.json({
      success: true,
      projectId: project.id,
      matches: topMatches.map((m) => ({
        investor: {
          id: m.investor.id,
          name: m.investor.name,
          type: m.investor.type,
        },
        score: m.score.overall,
        synergies: m.score.synergies,
      })),
      totalMatches: topMatches.length,
    });
  } catch (error) {
    console.error('[Matching] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create project and match investors',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/matching/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const industry = searchParams.get('industry');

    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status: status.toUpperCase() as any }),
        ...(industry && { industry }),
      },
      include: {
        matches: {
          take: 5,
          orderBy: { overallScore: 'desc' },
          include: {
            investor: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('[Matching] Get projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
