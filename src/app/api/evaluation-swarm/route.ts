import { NextRequest, NextResponse } from 'next/server';
import { EvaluationOrchestrator, Pitch } from '@/lib/agents/evaluation-swarm/orchestrator';
import { logger } from '@/lib/logger';

/**
 * POST /api/evaluation-swarm
 * 
 * Evaluate a startup pitch using the dynamic agent swarm system.
 * 
 * Body:
 * {
 *   pitch: Pitch
 * }
 * 
 * Returns: SwarmEvaluation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pitch } = body as { pitch: Pitch };

    if (!pitch || !pitch.id || !pitch.name) {
      return NextResponse.json(
        { error: 'Invalid pitch data' },
        { status: 400 }
      );
    }

    // Create orchestrator and run evaluation
    const orchestrator = new EvaluationOrchestrator(pitch);
    const evaluation = await orchestrator.evaluate();

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    logger.error('Evaluation swarm error:', error);
    return NextResponse.json(
      {
        error: 'Evaluation failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evaluation-swarm/agents
 * 
 * Returns available agent types and their capabilities
 */
export async function GET(request: NextRequest) {
  const { AGENT_REGISTRY } = await import('@/lib/agents/evaluation-swarm/orchestrator');
  
  return NextResponse.json({
    agents: AGENT_REGISTRY,
    totalAgents: Object.keys(AGENT_REGISTRY).length,
    description: 'Dynamic agent swarm system - spawns specialized evaluators based on startup needs',
  });
}
