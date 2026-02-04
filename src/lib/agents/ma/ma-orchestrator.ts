// M&A Orchestrator: Coordinates all M&A agents for comprehensive exit analysis

import { matchAcquirers, type AcquirerMatchResult } from './acquirer-matcher';
import { modelValuation, type ValuationResult } from './valuation-modeler';
import {
  prepareDueDiligence,
  type DueDiligenceResult,
  standardDataRoom,
} from './dd-preparer';
import { structureDeal, type DealResult } from './deal-structurer';

export interface ExitAnalysisInput {
  // Company basics
  name: string;
  industry: string;
  stage: string;
  founded: string;

  // Financials
  revenue: number;
  revenueGrowth: number;
  ebitda: number;
  ebitdaMargin: number;
  arr: number;
  burnRate: number;
  cashPosition: number;
  runway: number; // months

  // SaaS metrics (if applicable)
  customerCount: number;
  ltv: number;
  cac: number;
  churnRate: number;

  // Team
  employeeCount: number;
  foundersStaying: boolean;

  // Technology
  technology: string;
  hasIP: boolean;
  moat: string;

  // Cap table
  founderOwnership: number;
  investorOwnership: number;
  totalRaised: number;
  lastValuation: number;
  liquidationPreference: number;

  // Legal
  hasLitigation: boolean;
  hasDebt: boolean;
  hasPreferredStock: boolean;

  // Geography
  geography: string[];
  hasForeignSubsidiaries: boolean;

  // Exit goals
  targetExitValue: number; // What founders want
  timelinePressure: 'urgent' | 'moderate' | 'patient';
  preferredAcquirerType?: 'strategic' | 'pe' | 'public' | 'any';
}

export interface ExitAnalysisReport {
  executiveSummary: {
    recommendation: string;
    estimatedValue: { low: number; base: number; high: number };
    timeToExit: string;
    readinessScore: number;
    topAcquirers: string[];
  };
  acquirers: AcquirerMatchResult;
  valuation: ValuationResult;
  dueDiligence: DueDiligenceResult;
  dealStructure: DealResult;
  actionPlan: {
    phase: string;
    timeframe: string;
    actions: string[];
    priority: 'critical' | 'high' | 'medium';
  }[];
  risks: {
    risk: string;
    probability: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }[];
  successMetrics: {
    metric: string;
    target: string;
    current: string;
  }[];
}

export async function orchestrateExitAnalysis(
  input: ExitAnalysisInput
): Promise<ExitAnalysisReport> {
  console.log('[M&A Orchestrator] Starting comprehensive exit analysis...');

  // Run all agents in parallel (except deal structuring which needs valuation)
  const [acquirers, valuation, dueDiligence] = await Promise.all([
    // Agent 1: Match acquirers
    matchAcquirers({
      name: input.name,
      industry: input.industry,
      revenue: input.revenue,
      growth: input.revenueGrowth,
      technology: input.technology,
      team: input.employeeCount,
      customers: input.customerCount,
      geographic: input.geography.join(', '),
      moat: input.moat,
    }),

    // Agent 2: Model valuation
    modelValuation({
      revenue: input.revenue,
      revenueGrowth: input.revenueGrowth,
      ebitda: input.ebitda,
      ebitdaMargin: input.ebitdaMargin,
      arr: input.arr,
      customerCount: input.customerCount,
      ltv: input.ltv,
      cac: input.cac,
      churnRate: input.churnRate,
      industry: input.industry,
      stage: input.stage,
      profitability: input.ebitda > 0,
      cashPosition: input.cashPosition,
      burnRate: input.burnRate,
    }),

    // Agent 3: Prepare due diligence
    prepareDueDiligence({
      stage: input.stage,
      industry: input.industry,
      hasIP: input.hasIP,
      employeeCount: input.employeeCount,
      hasLitigation: input.hasLitigation,
      hasDebt: input.hasDebt,
      hasPreferredStock: input.hasPreferredStock,
      revenueModel: input.arr > 0 ? 'SaaS' : 'Other',
      geography: input.geography,
      hasForeignSubsidiaries: input.hasForeignSubsidiaries,
    }),
  ]);

  console.log('[M&A Orchestrator] Acquirer matching complete');
  console.log('[M&A Orchestrator] Valuation modeling complete');
  console.log('[M&A Orchestrator] Due diligence prep complete');

  // Agent 4: Structure deal (needs valuation results)
  const dealStructure = await structureDeal({
    valuation: valuation.recommendedRange,
    founderOwnership: input.founderOwnership,
    investorOwnership: input.investorOwnership,
    founderRetention: input.foundersStaying,
    taxBasis: input.totalRaised * (input.founderOwnership / 100), // Rough estimate
    acquirerType: (input.preferredAcquirerType === 'any' ? 'strategic' : input.preferredAcquirerType) || 'strategic',
    competitiveBidders: acquirers.topAcquirers.length > 5 ? 3 : 1,
    timelinePressure: input.timelinePressure,
    companyStage: input.stage,
    profitability: input.ebitda > 0,
  });

  console.log('[M&A Orchestrator] Deal structuring complete');

  // Synthesize executive summary
  const executiveSummary = {
    recommendation: generateRecommendation(
      valuation,
      dueDiligence.exitReadiness,
      input
    ),
    estimatedValue: valuation.recommendedRange,
    timeToExit: estimateTimeToExit(dueDiligence.exitReadiness.overall),
    readinessScore: dueDiligence.exitReadiness.overall,
    topAcquirers: acquirers.topAcquirers
      .slice(0, 5)
      .map((a) => `${a.name} (fit: ${a.fitScore}%)`),
  };

  // Generate action plan
  const actionPlan = generateActionPlan(
    dueDiligence.exitReadiness,
    input.timelinePressure
  );

  // Identify risks
  const risks = [
    ...dueDiligence.risks.map((r) => ({
      risk: r.risk,
      probability: r.severity as 'high' | 'medium' | 'low',
      impact: r.severity as 'high' | 'medium' | 'low',
      mitigation: r.mitigation,
    })),
    {
      risk: 'Market timing risk',
      probability: 'medium' as const,
      impact: 'high' as const,
      mitigation:
        'Monitor M&A market conditions; be prepared to accelerate or delay based on market sentiment',
    },
    {
      risk: 'Buyer competition',
      probability:
        acquirers.topAcquirers.length > 10 ? ('high' as const) : ('medium' as const),
      impact: 'medium' as const,
      mitigation: 'Run competitive process; set clear deadlines; avoid exclusivity',
    },
  ];

  // Define success metrics
  const successMetrics = [
    {
      metric: 'Exit Readiness Score',
      target: '85+',
      current: dueDiligence.exitReadiness.overall.toString(),
    },
    {
      metric: 'Data Room Completeness',
      target: '100%',
      current: calculateDataRoomCompleteness(dueDiligence.dataRoomChecklist),
    },
    {
      metric: 'Valuation vs Target',
      target: `$${input.targetExitValue.toLocaleString()}`,
      current: `$${valuation.recommendedRange.base.toLocaleString()}`,
    },
    {
      metric: 'Time to Close',
      target: '3-6 months',
      current: executiveSummary.timeToExit,
    },
  ];

  console.log('[M&A Orchestrator] Analysis complete!');

  return {
    executiveSummary,
    acquirers,
    valuation,
    dueDiligence,
    dealStructure,
    actionPlan,
    risks,
    successMetrics,
  };
}

// Helper: Generate executive recommendation
function generateRecommendation(
  valuation: ValuationResult,
  exitReadiness: any,
  input: ExitAnalysisInput
): string {
  const readiness = exitReadiness.overall;
  const valuationMet =
    valuation.recommendedRange.base >= input.targetExitValue * 0.8;

  if (readiness >= 80 && valuationMet) {
    return 'GO: Company is exit-ready. Recommend starting acquirer outreach within 30 days.';
  } else if (readiness >= 60 && valuationMet) {
    return 'PREPARE: Company is 60-90 days from exit-ready. Complete data room and address key issues, then proceed.';
  } else if (readiness < 60 && valuationMet) {
    return 'HOLD: Valuation is strong, but exit readiness needs work. Focus on resolving critical issues before going to market.';
  } else if (readiness >= 80 && !valuationMet) {
    return 'GROW: Company is operationally ready, but needs more scale to hit target valuation. Focus on growth for 6-12 months.';
  } else {
    return 'BUILD: Not yet exit-ready. Focus on fixing operational issues and growing revenue before considering exit.';
  }
}

// Helper: Estimate time to exit
function estimateTimeToExit(readinessScore: number): string {
  if (readinessScore >= 85) return '3-6 months (ready now)';
  if (readinessScore >= 70) return '4-8 months (minor prep needed)';
  if (readinessScore >= 50) return '6-12 months (moderate prep needed)';
  return '12+ months (significant prep needed)';
}

// Helper: Generate action plan
function generateActionPlan(
  exitReadiness: any,
  urgency: 'urgent' | 'moderate' | 'patient'
): any[] {
  const plan = [];

  // Critical issues first
  const criticalIssues = exitReadiness.categories
    .filter((c: any) => c.score < 60)
    .flatMap((c: any) => c.issues);

  if (criticalIssues.length > 0) {
    plan.push({
      phase: 'Critical Issue Resolution',
      timeframe: urgency === 'urgent' ? '2-4 weeks' : '4-8 weeks',
      actions: criticalIssues.slice(0, 5),
      priority: 'critical' as const,
    });
  }

  // Data room preparation
  plan.push({
    phase: 'Data Room Preparation',
    timeframe: '4-6 weeks',
    actions: [
      'Gather all corporate documents',
      'Organize financial statements (3 years)',
      'Compile customer contracts',
      'Document IP portfolio',
      'Prepare technology documentation',
    ],
    priority: 'high' as const,
  });

  // Acquirer outreach
  plan.push({
    phase: 'Acquirer Outreach',
    timeframe: '2-4 weeks',
    actions: [
      'Finalize target acquirer list',
      'Prepare teaser document',
      'Draft NDAs',
      'Schedule initial meetings',
      'Prepare management presentation',
    ],
    priority: 'high' as const,
  });

  // Due diligence readiness
  plan.push({
    phase: 'Due Diligence Preparation',
    timeframe: '4-8 weeks',
    actions: [
      'Set up virtual data room',
      'Prepare Q&A document',
      'Engage legal counsel',
      'Engage financial advisor',
      'Prepare management presentations',
    ],
    priority: 'medium' as const,
  });

  return plan;
}

// Helper: Calculate data room completeness
function calculateDataRoomCompleteness(sections: any[]): string {
  if (!sections || sections.length === 0) return '0%';

  const total = sections.length;
  const complete = sections.filter((s) => s.status === 'complete').length;

  return `${Math.round((complete / total) * 100)}%`;
}
