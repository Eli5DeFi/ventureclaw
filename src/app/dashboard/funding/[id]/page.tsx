'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Milestone {
  id: string;
  number: number;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  txHash?: string;
  completedAt?: string;
  verifiedAt?: string;
}

interface FundingDetail {
  id: string;
  dealAmount: number;
  equityPercent: number;
  dealType: string;
  status: string;
  totalReleased: number;
  acceptedAt: string;
  milestones: Milestone[];
  startup: {
    id: string;
    name: string;
    tagline: string;
  };
}

export default function FundingTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [funding, setFunding] = useState<FundingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user && id) {
      fetchFundingDetails();
    }
  }, [session, id]);

  const fetchFundingDetails = async () => {
    try {
      const res = await fetch(`/api/dashboard/funding/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFunding(data.funding);
      } else if (res.status === 404) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch funding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !funding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const completedMilestones = funding.milestones.filter(m => m.status === 'completed' || m.status === 'verified').length;
  const totalMilestones = funding.milestones.length;
  const progressPercent = (completedMilestones / totalMilestones) * 100;

  const getMilestoneStatusBadge = (status: string, txHash?: string) => {
    const config: Record<string, { color: string; text: string; icon: string }> = {
      pending: { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', text: 'Pending', icon: '⏳' },
      completed: { color: 'bg-blue-600/20 text-blue-400 border-blue-600/30', text: 'Completed', icon: '✅' },
      verified: { color: 'bg-green-600/20 text-green-400 border-green-600/30', text: 'Verified On-Chain', icon: '🔒' },
    };
    
    const { color, text, icon } = config[status] || config.pending;
    return (
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
          {icon} {text}
        </span>
        {txHash && (
          <a
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            View TX →
          </a>
        )}
      </div>
    );
  };

  const getDaysUntil = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
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
              <h1 className="text-4xl font-bold mb-2">{funding.startup.name}</h1>
              <p className="text-xl text-gray-400 mb-4">Funding Tracker</p>
            </div>
            <Link
              href={`/dashboard/pitch/${funding.startup.id}`}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all"
            >
              View Pitch
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Deal Summary + Progress */}
          <div className="lg:col-span-2 space-y-8">
            {/* Deal Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold mb-6">Deal Summary</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg border border-green-600/30">
                  <div className="text-sm text-gray-400 mb-1">Total Funding</div>
                  <div className="text-3xl font-bold text-green-400">
                    ${(funding.dealAmount / 100).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-600/30">
                  <div className="text-sm text-gray-400 mb-1">Equity Given</div>
                  <div className="text-3xl font-bold text-purple-400">
                    {funding.equityPercent}%
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-600/30">
                  <div className="text-sm text-gray-400 mb-1">Deal Type</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {funding.dealType}
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Funds Released</span>
                  <span className="text-lg font-bold text-green-400">
                    ${(funding.totalReleased / 100).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-600 to-emerald-600 h-3 rounded-full"
                    style={{ width: `${(funding.totalReleased / funding.dealAmount) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {((funding.totalReleased / funding.dealAmount) * 100).toFixed(1)}% of total
                </div>
              </div>
            </motion.div>

            {/* Milestone Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h2 className="text-2xl font-bold mb-6">Milestone Timeline</h2>
              
              {/* Progress Overview */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-600/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300">Overall Progress</span>
                  <span className="text-2xl font-bold">
                    {completedMilestones} / {totalMilestones}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-sm text-gray-400">
                  {progressPercent.toFixed(0)}% Complete
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-4">
                {funding.milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      milestone.status === 'verified'
                        ? 'bg-green-900/20 border-green-600/30'
                        : milestone.status === 'completed'
                        ? 'bg-blue-900/20 border-blue-600/30'
                        : 'bg-gray-900/50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          milestone.status === 'verified' || milestone.status === 'completed'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {milestone.number}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{milestone.description}</h3>
                          <div className="text-sm text-gray-400 mt-1">
                            Due {new Date(milestone.dueDate).toLocaleDateString()} • {getDaysUntil(milestone.dueDate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400 mb-2">
                          ${(milestone.amount / 100).toLocaleString()}
                        </div>
                        {getMilestoneStatusBadge(milestone.status, milestone.txHash)}
                      </div>
                    </div>

                    {milestone.completedAt && (
                      <div className="text-xs text-gray-500 mt-2">
                        Completed on {new Date(milestone.completedAt).toLocaleDateString()}
                        {milestone.verifiedAt && ` • Verified ${new Date(milestone.verifiedAt).toLocaleDateString()}`}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Quick Stats + Actions */}
          <div className="space-y-8">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <h3 className="font-semibold mb-4">Funding Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Deal Accepted</span>
                  <span className="text-gray-200">
                    {new Date(funding.acceptedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    funding.status === 'active'
                      ? 'bg-green-600/20 text-green-400'
                      : funding.status === 'completed'
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-red-600/20 text-red-400'
                  }`}>
                    {funding.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Remaining</span>
                  <span className="text-gray-200 font-semibold">
                    ${((funding.dealAmount - funding.totalReleased) / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Next Milestone */}
            {funding.milestones.find(m => m.status === 'pending') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-6 border border-yellow-600/30"
              >
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Next Milestone
                </h3>
                {(() => {
                  const next = funding.milestones.find(m => m.status === 'pending');
                  if (!next) return null;
                  return (
                    <div>
                      <div className="text-sm text-gray-300 mb-2">{next.description}</div>
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        ${(next.amount / 100).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Due {new Date(next.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Web3 Verification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-600/30"
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🔗</span> Web3 Integration
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Connect your wallet to verify milestones on-chain
              </p>
              <Link
                href={`/dashboard/funding/${funding.id}/verify`}
                className="block w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-center font-semibold transition-all"
              >
                Connect Wallet
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
