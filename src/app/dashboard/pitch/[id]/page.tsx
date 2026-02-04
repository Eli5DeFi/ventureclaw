'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PitchDetail {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  stage: string;
  fundingAsk: number;
  teamSize: number;
  founderName: string;
  founderEmail: string;
  website?: string;
  status: string;
  createdAt: string;
  analysis?: {
    id: string;
    overallScore: number;
    financialScore: number;
    technicalScore: number;
    marketScore: number;
    legalScore: number;
    recommendation: string;
    summary: string;
    valuation: number;
    financialFeedback: any;
    technicalFeedback: any;
    marketFeedback: any;
    legalFeedback: any;
    analysisStartedAt: string;
    analysisCompletedAt?: string;
  };
  funding?: {
    id: string;
    dealAmount: number;
    equityPercent: number;
    dealType: string;
    status: string;
  };
}

interface InvestmentOffer {
  id: string;
  amount: number;
  equity: number;
  dealType: string;
  terms: string;
}

export default function PitchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pitch, setPitch] = useState<PitchDetail | null>(null);
  const [offers, setOffers] = useState<InvestmentOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && id) {
      fetchPitchDetails();
    }
  }, [session, id]);

  const fetchPitchDetails = async () => {
    try {
      const res = await fetch(`/api/dashboard/pitch/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPitch(data.pitch);
        setOffers(data.offers || []);
      } else if (res.status === 404) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch pitch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to accept this funding offer?')) return;

    setAccepting(true);
    try {
      const res = await fetch(`/api/dashboard/pitch/${id}/accept-funding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });

      if (res.ok) {
        alert('Funding offer accepted! Redirecting to funding tracker...');
        const data = await res.json();
        router.push(`/dashboard/funding/${data.fundingId}`);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to accept offer');
      }
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert('Failed to accept offer');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !pitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationBadge = (recommendation: string) => {
    const config: Record<string, { color: string; text: string }> = {
      APPROVED: { color: 'bg-green-600/20 text-green-400 border-green-600/30', text: 'Approved' },
      CONDITIONAL: { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', text: 'Conditional' },
      REJECTED: { color: 'bg-red-600/20 text-red-400 border-red-600/30', text: 'Rejected' },
    };
    
    const { color, text } = config[recommendation] || config.CONDITIONAL;
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${color}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{pitch.name}</h1>
              <p className="text-xl text-gray-400 mb-4">{pitch.tagline}</p>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">
                  {pitch.industry}
                </span>
                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                  {pitch.stage}
                </span>
                {pitch.analysis && getRecommendationBadge(pitch.analysis.recommendation)}
              </div>
            </div>
            {pitch.funding && (
              <Link
                href={`/dashboard/funding/${pitch.funding.id}`}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all"
              >
                View Funding →
              </Link>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Pitch Info + Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pitch Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold mb-4">Pitch Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Description</h3>
                  <p className="text-gray-200">{pitch.description}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Funding Ask</h3>
                    <p className="text-lg font-semibold">
                      ${(pitch.fundingAsk / 100).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Team Size</h3>
                    <p className="text-lg font-semibold">{pitch.teamSize} people</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">Founder</h3>
                    <p className="text-lg font-semibold">{pitch.founderName}</p>
                  </div>
                  {pitch.website && (
                    <div>
                      <h3 className="text-sm text-gray-400 mb-1">Website</h3>
                      <a
                        href={pitch.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Visit →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* AI Analysis */}
            {pitch.analysis ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              >
                <h2 className="text-2xl font-bold mb-4">AI Agent Analysis</h2>
                
                {/* Overall Score */}
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-600/30">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-2">Overall Score</div>
                    <div className={`text-6xl font-bold ${getScoreColor(pitch.analysis.overallScore)}`}>
                      {pitch.analysis.overallScore}/100
                    </div>
                    <div className="mt-4 text-gray-300">{pitch.analysis.summary}</div>
                  </div>
                </div>

                {/* Individual Scores */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">💰 Financial</span>
                      <span className={`text-lg font-bold ${getScoreColor(pitch.analysis.financialScore)}`}>
                        {pitch.analysis.financialScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${pitch.analysis.financialScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">⚙️ Technical</span>
                      <span className={`text-lg font-bold ${getScoreColor(pitch.analysis.technicalScore)}`}>
                        {pitch.analysis.technicalScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${pitch.analysis.technicalScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">📊 Market</span>
                      <span className={`text-lg font-bold ${getScoreColor(pitch.analysis.marketScore)}`}>
                        {pitch.analysis.marketScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${pitch.analysis.marketScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">⚖️ Legal</span>
                      <span className={`text-lg font-bold ${getScoreColor(pitch.analysis.legalScore)}`}>
                        {pitch.analysis.legalScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${pitch.analysis.legalScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Valuation */}
                <div className="p-4 bg-green-900/20 rounded-lg border border-green-600/30">
                  <div className="text-sm text-gray-400 mb-1">AI-Estimated Valuation</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${(pitch.analysis.valuation / 100).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 text-center"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Analysis in Progress</h3>
                <p className="text-gray-400">
                  Our AI agents are analyzing your pitch. This usually takes 2-5 minutes.
                </p>
              </motion.div>
            )}
          </div>

          {/* Right Column: Investment Offers */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold mb-4">Investment Offers</h2>
              
              {pitch.funding ? (
                <div className="p-4 bg-green-900/20 rounded-lg border border-green-600/30">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="font-semibold text-green-400 mb-2">Funding Accepted!</div>
                    <Link
                      href={`/dashboard/funding/${pitch.funding.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View funding details →
                    </Link>
                  </div>
                </div>
              ) : offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-4 bg-gray-900/50 rounded-lg border border-purple-600/30"
                    >
                      <div className="mb-3">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          ${(offer.amount / 100).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">
                          for {offer.equity}% equity • {offer.dealType}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-4">{offer.terms}</p>
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        disabled={accepting}
                        className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-semibold transition-all disabled:opacity-50"
                      >
                        {accepting ? 'Accepting...' : 'Accept Offer'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-400">
                    No offers yet. Complete the analysis to receive investment offers.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-semibold mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Submitted</span>
                  <span className="text-gray-200">
                    {new Date(pitch.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {pitch.analysis?.analysisCompletedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Analysis Completed</span>
                    <span className="text-green-400">✓</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Offers Received</span>
                  <span className="text-gray-200">{offers.length}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
