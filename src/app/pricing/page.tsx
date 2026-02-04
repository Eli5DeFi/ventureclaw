'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  CheckIcon,
  RocketLaunchIcon,
  SparklesIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <div className="relative z-10 container mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">YCombinator Model</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Apply free. Get instant AI analysis. Join our batch for funding and support.
          </p>
        </motion.div>

        {/* Main Offer - YC Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="glass rounded-2xl p-8 border-2 border-[#00f0ff]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Standard Deal</h2>
              <p className="text-gray-400">Same for everyone, like YCombinator</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#00f0ff] mb-2">$125K</div>
                <div className="text-gray-400">Investment</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#a855f7] mb-2">7%</div>
                <div className="text-gray-400">Equity</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#10b981] mb-2">3 mo</div>
                <div className="text-gray-400">Batch Duration</div>
              </div>
            </div>

            <div className="bg-black/50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-[#00f0ff]" />
                What You Get
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'AI agent swarms (24/7 support)',
                  'Product development assistance',
                  'Investor introductions',
                  'Weekly founder dinners',
                  'Demo Day pitch coaching',
                  'Legal & accounting templates',
                  'Follow-on funding support',
                  'Alumni network access',
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckIcon className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/pitch">
              <motion.button
                className="w-full btn-primary text-lg py-4 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RocketLaunchIcon className="w-6 h-6" />
                Apply Now (Free)
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Premium Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            Premium Services <span className="text-gray-500">(Optional)</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* DeFi Launch */}
            <div className="glass rounded-xl p-6">
              <div className="text-2xl font-bold mb-2">🔥 DeFi Launch</div>
              <div className="text-3xl font-bold mb-4">
                <span className="text-[#00f0ff]">$2,999</span>
                <span className="text-gray-500 text-lg"> one-time</span>
              </div>
              <p className="text-gray-400 mb-6">
                Complete tokenomics, security audit, and liquidity strategy
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Tokenomics design (ve-model)',
                  'Smart contract audit',
                  'Liquidity strategy (LBP, POL)',
                  '72-hour delivery',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckIcon className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/defi">
                <button className="w-full glass hover:bg-white/5 py-3 rounded-lg transition">
                  Learn More
                </button>
              </Link>
            </div>

            {/* M&A Exit */}
            <div className="glass rounded-xl p-6">
              <div className="text-2xl font-bold mb-2">🚀 M&A Exit</div>
              <div className="text-3xl font-bold mb-4">
                <span className="text-[#00f0ff]">$9,999</span>
                <span className="text-gray-500 text-lg"> + success fee</span>
              </div>
              <p className="text-gray-400 mb-6">
                Complete exit preparation and acquirer matching
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  '20-30 acquirer matches',
                  'Valuation modeling',
                  'DD preparation',
                  '0.25% success fee (optional)',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckIcon className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/exit">
                <button className="w-full glass hover:bg-white/5 py-3 rounded-lg transition">
                  Learn More
                </button>
              </Link>
            </div>

            {/* Follow-on Fundraising */}
            <div className="glass rounded-xl p-6">
              <div className="text-2xl font-bold mb-2">💰 Follow-on Raise</div>
              <div className="text-3xl font-bold mb-4">
                <span className="text-[#10b981]">Success-based</span>
              </div>
              <p className="text-gray-400 mb-6">
                Help raising Series A, B, C+ with our VC network
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Warm VC introductions',
                  'Pitch deck optimization',
                  'Term sheet negotiation',
                  '2% of amount raised',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckIcon className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/marketplace-demo">
                <button className="w-full glass hover:bg-white/5 py-3 rounded-lg transition">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8">FAQs</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is the application really free?',
                a: 'Yes, 100% free. Submit your pitch and get AI analysis instantly. No credit card required.',
              },
              {
                q: 'How does batch acceptance work?',
                a: 'AI agents analyze all applications. Top companies are invited to join our 3-month batch. We invest $125K for 7% equity.',
              },
              {
                q: 'What if I just want the analysis?',
                a: 'No problem! You can use our free analysis without applying to the batch. Great for testing ideas or getting feedback.',
              },
              {
                q: 'Do I need to be crypto/DeFi focused?',
                a: 'Not at all. We accept all types of startups - AI, SaaS, hardware, climate tech, anything. The DeFi service is optional.',
              },
              {
                q: 'How are you different from YCombinator?',
                a: 'We use AI agent swarms to provide 24/7 support at scale. Same batch model, same deal terms, but with AI superpowers.',
              },
            ].map((faq, i) => (
              <div key={i} className="glass rounded-xl p-6">
                <h3 className="text-xl font-bold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-gray-400 mb-8">
            Applications are open. Get your AI analysis in seconds.
          </p>
          <Link href="/pitch">
            <motion.button
              className="btn-primary text-lg px-12 py-4 inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <RocketLaunchIcon className="w-6 h-6" />
              Apply Free Now
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
