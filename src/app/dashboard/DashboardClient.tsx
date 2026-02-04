'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Pitch {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  stage: string;
  fundingAsk: number;
  status: string;
  createdAt: Date;
  funding: any | null;
}

interface DashboardClientProps {
  user: any;
  pitches: Pitch[];
}

export default function DashboardClient({ user, pitches }: DashboardClientProps) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      analyzing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      approved: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
      conditional: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    total: pitches.length,
    approved: pitches.filter(p => p.status === 'approved').length,
    analyzing: pitches.filter(p => p.status === 'analyzing').length,
    funded: pitches.filter(p => p.funding).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                VentureClaw 🦾
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {user.name || user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Track your applications and funding status</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Total Applications</div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Analyzing</div>
              <div className="text-3xl font-bold text-blue-400">{stats.analyzing}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Approved</div>
              <div className="text-3xl font-bold text-green-400">{stats.approved}</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Funded</div>
              <div className="text-3xl font-bold text-purple-400">{stats.funded}</div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Applications</h2>
              <Link
                href="/pitch"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
              >
                + New Application
              </Link>
            </div>

            {pitches.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-4">No applications yet</p>
                <Link
                  href="/pitch"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
                >
                  Submit Your First Pitch
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Startup
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Industry
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Funding Ask
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {pitches.map((pitch) => (
                      <tr key={pitch.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{pitch.name}</div>
                          <div className="text-sm text-gray-400">{pitch.tagline}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{pitch.industry}</td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 capitalize">{pitch.stage}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          ${(pitch.fundingAsk / 1000).toFixed(0)}K
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(pitch.status)}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(pitch.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/pitch/${pitch.id}`}
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
