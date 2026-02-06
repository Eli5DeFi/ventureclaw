// API: DeFi Protocol Accelerator
// POST /api/defi/accelerate - Run complete DeFi analysis

import { NextRequest, NextResponse } from 'next/server';
import {
  orchestrateDeFiAccelerator,
  type DeFiProtocolInput,
} from '@/lib/agents/defi/defi-orchestrator';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ['name', 'type', 'description', 'targetLaunchDate', 'expectedTVL'];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    logger.log('[DeFi API] Starting analysis for:', body.name);

    // Build input
    const input: DeFiProtocolInput = {
      name: body.name,
      type: body.type,
      description: body.description,
      targetLaunchDate: body.targetLaunchDate,
      expectedTVL: body.expectedTVL,
      competitorTokenomics: body.competitorTokenomics || [],
      revenueModel: body.revenueModel || 'Trading fees',
      communitySize: body.communitySize || 1000,
      contractLanguage: body.contractLanguage || 'Solidity',
      contractComplexity: body.contractComplexity || 'medium',
      hasUpgradeability: body.hasUpgradeability ?? false,
      hasOracles: body.hasOracles ?? false,
      hasMultisig: body.hasMultisig ?? true,
      codeSnippet: body.codeSnippet,
      dependencies: body.dependencies || ['OpenZeppelin'],
      solidityVersion: body.solidityVersion || '0.8.20',
      hasTests: body.hasTests ?? true,
      testCoverage: body.testCoverage || 80,
      liquidityBudget: body.liquidityBudget || 500000,
      targetTVL: body.expectedTVL,
      hasRevenue: body.hasRevenue ?? false,
      monthlyRevenue: body.monthlyRevenue || 0,
      competitors: body.competitors || [],
    };

    // Run orchestrator
    const report = await orchestrateDeFiAccelerator(input);

    logger.log('[DeFi API] Analysis complete');

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error('[DeFi API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run DeFi analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
