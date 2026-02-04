'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Pricing() {
  const [mode, setMode] = useState<'human' | 'agent'>('human');

  const humanPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'For individual founders testing the platform',
      features: [
        '1 pitch analysis/month',
        'Basic financial analysis',
        'Community support',
        'Public results (anonymized)',
      ],
      cta: 'Get Started',
      href: '/pitch',
      popular: false,
    },
    {
      name: 'Startup',
      price: '$499',
      period: '/month',
      description: 'For startups actively fundraising',
      features: [
        '10 pitch analyses/month',
        'All 4 AI agents (financial, technical, market, legal)',
        'Investor matching (up to 20 matches)',
        'Priority support',
        'Private results',
        'Export to PDF',
      ],
      cta: 'Start Trial',
      href: '/pricing/checkout?plan=startup',
      popular: true,
    },
    {
      name: 'DeFi Pro',
      price: '$2,999',
      period: 'one-time',
      description: 'Complete DeFi protocol launch package',
      features: [
        'Tokenomics design (ve-model)',
        'Smart contract security audit',
        'Liquidity strategy (LBP, POL)',
        'CEX listing roadmap',
        '72-hour delivery',
        'Dedicated support',
      ],
      cta: 'Launch DeFi',
      href: '/defi',
      popular: false,
    },
    {
      name: 'M&A Exit',
      price: '$9,999',
      period: 'one-time',
      description: 'Comprehensive exit analysis',
      features: [
        '20-30 acquirer matches',
        'Multi-method valuation',
        'Due diligence prep (100+ docs)',
        'Deal structure recommendations',
        'Exit readiness score',
        'Success fee option (0.25%)',
      ],
      cta: 'Plan Exit',
      href: '/exit',
      popular: false,
    },
  ];

  const agentPlans = [
    {
      name: 'Free Tier',
      price: '$0',
      period: '/month',
      description: 'For AI agents in development/testing',
      features: [
        '10 API calls/month',
        '1 request/minute rate limit',
        'All endpoints (pitch, DeFi, matching, M&A)',
        'Community support',
        'Public API docs',
      ],
      cta: 'Get API Key',
      href: '/api-keys',
      popular: false,
    },
    {
      name: 'Agent Tier',
      price: '$99',
      period: '/month',
      description: 'For production AI agents',
      features: [
        'Unlimited API calls',
        '100 requests/minute',
        'All endpoints',
        'Priority support (24h response)',
        'SDK + CLI included',
        'Analytics dashboard',
      ],
      cta: 'Enable Agent Mode',
      href: '/pricing/checkout?plan=agent',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '$499',
      period: '/month',
      description: 'For AI agent platforms & enterprises',
      features: [
        'Unlimited API calls',
        '1,000 requests/minute',
        'Dedicated infrastructure',
        'White-label option',
        'Custom integrations',
        'SLA (99.9% uptime)',
        '1-hour support response',
      ],
      cta: 'Contact Sales',
      href: '/contact',
      popular: false,
    },
  ];

  const plans = mode === 'human' ? humanPlans : agentPlans;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">Choose Your Mode</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Whether you're a human founder or an AI agent, we've got you covered
          </p>

          {/* Mode Toggle */}
          <div className="inline-flex rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setMode('human')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                mode === 'human'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👤 Human Mode
            </button>
            <button
              onClick={() => setMode('agent')}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                mode === 'agent'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🤖 AI Agent Mode
            </button>
          </div>
        </motion.div>

        {/* Mode Description */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-12 p-6 rounded-xl bg-gray-800/50 backdrop-blur-sm"
        >
          {mode === 'human' ? (
            <>
              <h3 className="text-2xl font-bold mb-3">👤 Human Mode</h3>
              <p className="text-gray-300 mb-4">
                Beautiful web interface for founders, VCs, and operators. Submit pitches,
                analyze DeFi protocols, match with investors, and plan exits — all through
                an intuitive UI.
              </p>
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400">
                  Web UI
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400">
                  Interactive dashboards
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400">
                  Visual reports
                </span>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-3">🤖 AI Agent Mode</h3>
              <p className="text-gray-300 mb-4">
                Programmatic API access for AI agents (OpenClaw, Claude Code, Cursor, etc.).
                Install via npm, use CLI, or integrate via SDK. Perfect for automation, batch
                processing, and agent-to-agent workflows.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <code className="text-green-400 text-sm">
                  $ npm install -g @swarm-accelerator/cli<br />
                  $ swarm analyze --file pitch.json
                </code>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400">
                  REST API
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400">
                  CLI
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400">
                  OpenClaw skill
                </span>
              </div>
            </>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-purple-500'
                  : 'bg-gray-800/50 border border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6 text-sm h-12">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <svg
                      className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Installation Instructions (Agent Mode) */}
        {mode === 'agent' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-16 p-8 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700"
          >
            <h3 className="text-2xl font-bold mb-6">🚀 Quick Start for AI Agents</h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-2">1. Install CLI</h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <code className="text-green-400">
                    npm install -g @swarm-accelerator/cli
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">2. Get API Key</h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <code className="text-green-400">
                    # Visit: https://swarm.accelerator.ai/api-keys<br />
                    export SWARM_API_KEY=sk_agent_your_key_here
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">3. Run Analysis</h4>
                <div className="bg-gray-900 rounded-lg p-4">
                  <code className="text-green-400">
                    swarm analyze --file pitch.json --output analysis.json
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-2">4. OpenClaw Skill</h4>
                <p className="text-gray-400 mb-2">
                  For OpenClaw agents, the skill is pre-installed. Just use the commands:
                </p>
                <div className="bg-gray-900 rounded-lg p-4">
                  <code className="text-green-400">
                    swarm analyze --file pitch.json<br />
                    swarm defi --file protocol.json<br />
                    swarm match --file project.json<br />
                    swarm exit --file company.json
                  </code>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-900/30 border border-blue-600/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>💡 Tip:</strong> Combine Swarm with other OpenClaw skills (bird,
                slack, notion) for powerful automation workflows!
              </p>
            </div>
          </motion.div>
        )}

        {/* FAQ */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

          <div className="space-y-4">
            <details className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
              <summary className="font-semibold cursor-pointer">
                What's the difference between Human Mode and AI Agent Mode?
              </summary>
              <p className="mt-4 text-gray-400">
                Human Mode uses the web UI (beautiful dashboards, visual reports). AI Agent
                Mode uses the API/CLI (programmatic access for automation). Both access the
                same powerful AI agents, just different interfaces.
              </p>
            </details>

            <details className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
              <summary className="font-semibold cursor-pointer">
                Can I use both modes?
              </summary>
              <p className="mt-4 text-gray-400">
                Yes! Subscribe to a human plan (e.g., Startup $499/mo) AND an agent plan
                (Agent $99/mo) to access both. Perfect for teams where humans use the UI
                and automation scripts use the API.
              </p>
            </details>

            <details className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
              <summary className="font-semibold cursor-pointer">
                Which AI agents are supported?
              </summary>
              <p className="mt-4 text-gray-400">
                Any AI agent that can execute shell commands or make HTTP requests:
                OpenClaw, Claude Code, Cursor, GitHub Copilot, Aider, Cline, Windsurf, or
                custom agents. We provide a CLI and SDK for easy integration.
              </p>
            </details>

            <details className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
              <summary className="font-semibold cursor-pointer">
                What are the rate limits?
              </summary>
              <p className="mt-4 text-gray-400">
                Free: 10 requests/month. Agent ($99/mo): Unlimited requests, 100/minute.
                Enterprise ($499/mo): Unlimited requests, 1,000/minute. Humans have
                separate limits (no strict cap, fair use policy).
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
