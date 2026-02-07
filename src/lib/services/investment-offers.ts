/**
 * Investment Offer Generation Service
 * 
 * Generates realistic investment offers based on pitch analysis.
 * Currently stores offers in Analysis.offersGenerated JSON field.
 * 
 * TODO: Migrate to InvestmentOffer table when PostgreSQL is set up.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface InvestmentOffer {
  id: string;
  pitchId: string;
  offerAmount: number;        // USD (not cents for API consistency)
  equity: number;             // Percentage
  dealType: 'SAFE' | 'Equity' | 'Convertible';
  terms: string;
  investor: string;
  investorType: 'AI' | 'VC' | 'Angel';
  expiresAt: string;          // ISO date string
  status: 'active' | 'accepted' | 'expired' | 'withdrawn';
  createdAt: string;          // ISO date string
  analysisScore?: number;     // Optional: score that generated this
}

/**
 * Generate investment offers based on analysis results (on-demand)
 * 
 * NOTE: Currently generates offers on-demand from analysis data.
 * When PostgreSQL migration is complete, offers will be stored in InvestmentOffer table.
 */
export async function generateOffersForAnalysis(
  pitch: { id: string; fundingAsk: number },
  analysis: { recommendation: string; overallScore: number; createdAt: Date }
): Promise<InvestmentOffer[]> {
  const offers: InvestmentOffer[] = [];

  // Only generate offers for APPROVED pitches
  if (analysis.recommendation !== 'APPROVED') {
    return offers;
  }

  const analysisDate = analysis.createdAt;

  // Standard offer: 80% of ask at reasonable equity
  const standardOffer: InvestmentOffer = {
    id: `offer_${pitch.id}_1`,
    pitchId: pitch.id,
    offerAmount: Math.floor(pitch.fundingAsk * 0.8),
    equity: calculateEquityForScore(analysis.overallScore, pitch.fundingAsk, 0.8),
    dealType: 'SAFE',
    terms: generateSAFETerms(pitch.fundingAsk),
    investor: 'AI Ventures',
    investorType: 'AI',
    expiresAt: new Date(analysisDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from analysis
    status: 'active',
    createdAt: analysisDate.toISOString(),
    analysisScore: analysis.overallScore,
  };
  offers.push(standardOffer);

  // Premium offer for high-scoring pitches: Full ask at higher equity
  if (analysis.overallScore >= 85) {
    const premiumOffer: InvestmentOffer = {
      id: `offer_${pitch.id}_2`,
      pitchId: pitch.id,
      offerAmount: pitch.fundingAsk, // Full ask
      equity: calculateEquityForScore(analysis.overallScore, pitch.fundingAsk, 1.0),
      dealType: 'Equity',
      terms: generateEquityTerms(pitch.fundingAsk),
      investor: selectPremiumInvestor(analysis.overallScore),
      investorType: 'VC',
      expiresAt: new Date(analysisDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      status: 'active',
      createdAt: analysisDate.toISOString(),
      analysisScore: analysis.overallScore,
    };
    offers.push(premiumOffer);
  }

  // Exceptional offer for top-tier pitches: Over-subscribed round
  if (analysis.overallScore >= 95) {
    const exceptionalOffer: InvestmentOffer = {
      id: `offer_${pitch.id}_3`,
      pitchId: pitch.id,
      offerAmount: Math.floor(pitch.fundingAsk * 1.5), // 150% of ask
      equity: calculateEquityForScore(analysis.overallScore, pitch.fundingAsk, 1.5),
      dealType: 'Equity',
      terms: generateOversubscribedTerms(pitch.fundingAsk),
      investor: 'Sequoia Capital',
      investorType: 'VC',
      expiresAt: new Date(analysisDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'active',
      createdAt: analysisDate.toISOString(),
      analysisScore: analysis.overallScore,
    };
    offers.push(exceptionalOffer);
  }

  logger.info(`[Offers] Generated ${offers.length} offers for pitch ${pitch.id} (score: ${analysis.overallScore})`);
  
  return offers;
}

/**
 * Get active offers for a pitch (generated on-demand)
 */
export async function getOffersForPitch(pitchId: string): Promise<InvestmentOffer[]> {
  const pitch = await prisma.startup.findUnique({
    where: { id: pitchId },
    select: {
      id: true,
      fundingAsk: true,
      analysis: {
        select: {
          recommendation: true,
          overallScore: true,
          createdAt: true,
        },
      },
      funding: true,
    },
  });

  if (!pitch || !pitch.analysis) {
    return [];
  }

  // If funding already accepted, no active offers
  if (pitch.funding) {
    logger.info(`[Offers] Pitch ${pitchId} already funded, no active offers`);
    return [];
  }

  // Generate offers on-demand from analysis data
  const allOffers = await generateOffersForAnalysis(
    { id: pitch.id, fundingAsk: pitch.fundingAsk },
    pitch.analysis
  );

  // Filter out expired offers
  const now = new Date();
  const activeOffers = allOffers.filter(offer => {
    const expiresAt = new Date(offer.expiresAt);
    return expiresAt > now;
  });

  return activeOffers;
}

/**
 * Get a specific offer by ID
 */
export async function getOfferById(pitchId: string, offerId: string): Promise<InvestmentOffer | null> {
  const offers = await getOffersForPitch(pitchId);
  return offers.find(o => o.id === offerId) || null;
}

/**
 * Mark an offer as accepted
 * 
 * NOTE: Currently a no-op since offers are generated on-demand.
 * When PostgreSQL migration is complete, this will update the InvestmentOffer table.
 */
export async function acceptOffer(pitchId: string, offerId: string): Promise<InvestmentOffer | null> {
  // Verify offer exists by generating it
  const offer = await getOfferById(pitchId, offerId);
  
  if (!offer) {
    return null;
  }

  logger.info(`[Offers] Accepted offer ${offerId} for pitch ${pitchId}`);

  // When PostgreSQL is set up, update status in database
  // For now, acceptance is implicit when Funding record is created

  return offer;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate fair equity percentage based on score and funding amount
 */
function calculateEquityForScore(score: number, fundingAsk: number, multiplier: number): number {
  // Base equity calculation (higher score = lower equity)
  // Score 75-85: 18-22% equity
  // Score 85-95: 15-18% equity
  // Score 95+: 10-15% equity

  let baseEquity: number;
  
  if (score >= 95) {
    baseEquity = 10 + (100 - score) * 0.5;
  } else if (score >= 85) {
    baseEquity = 15 + (95 - score) * 0.3;
  } else {
    baseEquity = 18 + (85 - score) * 0.4;
  }

  // Adjust for funding amount (larger rounds = more equity)
  const fundingAdjustment = Math.log10(fundingAsk / 100000) * 2; // Log scale adjustment
  
  // Adjust for multiplier (over-subscribed rounds get better terms)
  const multiplierBonus = multiplier > 1 ? (multiplier - 1) * 3 : 0;

  const finalEquity = Math.min(25, Math.max(8, baseEquity + fundingAdjustment - multiplierBonus));
  
  return Math.round(finalEquity * 10) / 10; // Round to 1 decimal
}

/**
 * Generate SAFE terms based on funding ask
 */
function generateSAFETerms(fundingAsk: number): string {
  const capMultiplier = fundingAsk < 500000 ? 8 : fundingAsk < 2000000 ? 10 : 12;
  const cap = fundingAsk * capMultiplier;
  const discount = fundingAsk < 500000 ? 25 : 20;

  return `$${(cap / 1000000).toFixed(1)}M valuation cap, ${discount}% discount. Post-money SAFE. No board seat. Information rights included. Pro-rata rights for next round.`;
}

/**
 * Generate priced equity round terms
 */
function generateEquityTerms(fundingAsk: number): string {
  const postMoney = fundingAsk * 8;
  
  return `Priced round at $${(postMoney / 1000000).toFixed(1)}M post-money valuation. Board observer seat. Quarterly financial reporting. Standard pro-rata rights. 1x liquidation preference.`;
}

/**
 * Generate oversubscribed round terms
 */
function generateOversubscribedTerms(fundingAsk: number): string {
  const postMoney = fundingAsk * 12;
  
  return `Oversubscribed round at $${(postMoney / 1000000).toFixed(1)}M post-money. Lead investor. Board seat. Monthly reporting. 2x pro-rata. Strategic partnership opportunities. Participating preferred.`;
}

/**
 * Select premium investor based on score
 */
function selectPremiumInvestor(score: number): string {
  if (score >= 95) return 'Sequoia Capital';
  if (score >= 92) return 'Andreessen Horowitz';
  if (score >= 90) return 'Benchmark';
  if (score >= 87) return 'Greylock Partners';
  return 'Accel';
}
