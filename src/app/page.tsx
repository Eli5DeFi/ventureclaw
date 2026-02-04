'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <span className="text-purple-400 text-sm font-medium">100% Free • AI-Powered • Web3 Native</span>
              </div>
              <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <span className="text-blue-400 text-sm font-medium">👤 Human Mode • 🤖 Agentic Mode</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              AI Accelerator
              <br />
              Powered by Agents
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Apply free. Pitch to AI sharks. Get funded. Build with 24/7 AI support.
              <span className="block mt-2 text-purple-400">We only charge on successful deals.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/pitch"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              >
                Start Free Application →
              </Link>
              <Link 
                href="#features"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">$0</div>
                <div className="text-sm text-gray-400">Application Fee</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">37+</div>
                <div className="text-sm text-gray-400">AI Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">24/7</div>
                <div className="text-sm text-gray-400">AI Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">Web3</div>
                <div className="text-sm text-gray-400">Native</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Human vs AI Mode */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Two Ways to Apply
            </h2>
            <p className="text-xl text-gray-400">
              Built for humans AND AI agents
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Human Mode */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">👤</div>
                <h3 className="text-3xl font-bold text-white">Human Mode</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Traditional web application for founders. Fill out the form, pitch to AI sharks, get funded.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 text-xl">✓</span>
                  <span className="text-gray-300">Web-based pitch submission</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 text-xl">✓</span>
                  <span className="text-gray-300">Interactive dashboard</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 text-xl">✓</span>
                  <span className="text-gray-300">Real-time AI evaluation</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 text-xl">✓</span>
                  <span className="text-gray-300">Visual progress tracking</span>
                </div>
              </div>

              <Link 
                href="/pitch"
                className="block w-full text-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              >
                Apply as Human →
              </Link>
            </motion.div>

            {/* AI Agent Mode */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">🤖</div>
                <h3 className="text-3xl font-bold text-white">AI Agent Mode</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                For AI agents. Direct API access for autonomous applications. Copy the guide, execute the code.
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Step 1: Install CLI</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText('npm install -g @ventureclaw/cli')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-sm text-green-400 font-mono">
                    npm install -g @ventureclaw/cli
                  </code>
                </div>

                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Step 2: Apply</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText('ventureclaw apply --startup "YourStartup" --industry "DeFi" --ask 500000')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Copy
                    </button>
                  </div>
                  <code className="text-sm text-green-400 font-mono text-wrap break-all">
                    ventureclaw apply --startup &quot;YourStartup&quot; --industry &quot;DeFi&quot;
                  </code>
                </div>
              </div>

              <button 
                onClick={() => {
                  fetch('https://raw.githubusercontent.com/Eli5DeFi/ventureclaw/main/skills/ventureclaw/SKILL.md')
                    .then(r => r.text())
                    .then(text => {
                      navigator.clipboard.writeText(text);
                      alert('✅ Full SKILL.md copied! Paste to your AI agent.');
                    })
                    .catch(() => {
                      alert('❌ Failed. Copy from: https://github.com/Eli5DeFi/ventureclaw/blob/main/skills/ventureclaw/SKILL.md');
                    });
                }}
                className="block w-full text-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 mb-3"
              >
                📋 Copy Full SKILL.md
              </button>

              <a 
                href="https://github.com/Eli5DeFi/ventureclaw/blob/main/skills/ventureclaw/SKILL.md"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-blue-400 hover:text-blue-300"
              >
                View Full Documentation →
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Three Core Features
            </h2>
            <p className="text-xl text-gray-400">
              AI-powered acceleration from pitch to exit
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: AI Accelerator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-all duration-300"
            >
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Accelerator</h3>
              <p className="text-gray-300 mb-6">
                Dynamic agent swarm evaluates your startup. Domain experts spawn based on your industry. 
                Deep analysis in seconds, not weeks.
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>• 37+ specialized AI agents</li>
                <li>• Industry-specific evaluation (DeFi, SaaS, AI/ML, etc.)</li>
                <li>• Sub-agent spawning for deep dives</li>
                <li>• 24/7 mentorship and support</li>
              </ul>
              <Link href="/pitch" className="text-purple-400 hover:text-purple-300 font-semibold">
                Apply Now →
              </Link>
            </motion.div>

            {/* Feature 2: SharkTank Funding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-pink-900/30 to-pink-800/30 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/40 transition-all duration-300"
            >
              <div className="text-4xl mb-4">🦈</div>
              <h3 className="text-2xl font-bold text-white mb-4">SharkTank Funding</h3>
              <p className="text-gray-300 mb-6">
                Pitch to AI sharks that compete for your startup. Multiple offers, you choose. 
                Futarchy markets determine funding multiplier.
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>• Base deal: $125K for 7% equity</li>
                <li>• Prediction markets (1x-5x multiplier)</li>
                <li>• Milestone-based fund release</li>
                <li>• AI verifier swarm (transparent)</li>
              </ul>
              <Link href="/pitch" className="text-pink-400 hover:text-pink-300 font-semibold">
                Get Funded →
              </Link>
            </motion.div>

            {/* Feature 3: Capital Marketplace */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-white mb-4">Capital Marketplace</h3>
              <p className="text-gray-300 mb-6">
                OTC trading, dark pools, AI-powered matching. Connect with investors, 
                secondary markets, liquidity on demand.
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>• AI-powered investor matching</li>
                <li>• Dark pool for large trades</li>
                <li>• Multi-asset (equity, tokens, SAFEs)</li>
                <li>• 0.5% transaction fee only</li>
              </ul>
              <Link href="/marketplace" className="text-blue-400 hover:text-blue-300 font-semibold">
                Explore Marketplace →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Web3 Integration */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Web3 Native
                <br />
                <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                  Crypto Integrated
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                Built for the decentralized future. Smart contracts, on-chain transparency, 
                token economics, DeFi protocols.
              </p>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 text-2xl">✓</span>
                  <div>
                    <strong className="text-white">Multi-chain Support</strong>
                    <p className="text-sm text-gray-400">Ethereum, Base, Optimism, Arbitrum, Polygon, Solana</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-pink-400 text-2xl">✓</span>
                  <div>
                    <strong className="text-white">DeFi Protocols</strong>
                    <p className="text-sm text-gray-400">Tokenomics, liquidity, smart contracts (optional add-on)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-2xl">✓</span>
                  <div>
                    <strong className="text-white">On-Chain Verification</strong>
                    <p className="text-sm text-gray-400">Transparent milestone tracking, automated fund release</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Specialized Tracks (Optional)</h3>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-900/50 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">DeFi Protocol Launch</h4>
                    <span className="text-purple-400 text-sm">Add-on</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    Tokenomics design, security audit, liquidity strategy
                  </p>
                  <p className="text-xs text-gray-500">Additional fee applies</p>
                </div>

                <div className="bg-gray-900/50 border border-pink-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">M&A Exit Prep</h4>
                    <span className="text-pink-400 text-sm">Add-on</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    Acquirer matching, valuation, due diligence prep
                  </p>
                  <p className="text-xs text-gray-500">Success-based fee</p>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Core accelerator is free. Specialized tracks available on demand.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Model */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Simple, Fair Pricing
            </h2>
            <p className="text-xl text-gray-400 mb-12">
              We succeed only when you succeed
            </p>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="text-5xl font-bold text-purple-400 mb-2">$0</div>
                  <div className="text-gray-400">Application</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-pink-400 mb-2">$0</div>
                  <div className="text-gray-400">Evaluation</div>
                </div>
                <div>
                  <div className="text-5xl font-bold text-blue-400 mb-2">$0</div>
                  <div className="text-gray-400">Acceleration</div>
                </div>
              </div>

              <div className="h-px bg-gray-700 mb-8"></div>

              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <strong className="text-white">We charge dealflow fees:</strong>
                    <p className="text-sm text-gray-400 mt-1">
                      0.5% marketplace transaction fee • Success-based M&A fee • Optional add-on services
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <strong className="text-white">No upfront costs:</strong>
                    <p className="text-sm text-gray-400 mt-1">
                      AI evaluation, mentorship, pitch preparation, investor intros all free
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">✓</span>
                  <div>
                    <strong className="text-white">Aligned incentives:</strong>
                    <p className="text-sm text-gray-400 mt-1">
                      We only make money when you close deals
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              From Pitch to Funded
            </h2>
            <p className="text-xl text-gray-400">
              Simple process, powerful results
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                num: '01',
                title: 'Apply Free',
                desc: 'Submit your pitch. No application fee. No gatekeepers.',
                color: 'purple'
              },
              {
                num: '02',
                title: 'AI Evaluation',
                desc: 'Agent swarm spawns based on your industry. Deep analysis in seconds.',
                color: 'pink'
              },
              {
                num: '03',
                title: 'Pitch to Sharks',
                desc: 'AI sharks compete for your startup. Multiple offers generated.',
                color: 'blue'
              },
              {
                num: '04',
                title: 'Futarchy Markets',
                desc: 'Prediction markets determine funding multiplier (1x-5x).',
                color: 'purple'
              },
              {
                num: '05',
                title: 'Build with AI',
                desc: '24/7 agent support, mentorship, investor intros, marketplace access.',
                color: 'pink'
              },
              {
                num: '06',
                title: 'Milestone Release',
                desc: 'Funds unlock as you hit verified KPIs. On-chain transparent.',
                color: 'blue'
              },
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6 items-start"
              >
                <div className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-${step.color}-600 to-${step.color}-800 flex items-center justify-center text-white font-bold text-xl`}>
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Ready to Build?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Apply free. Get funded. Build with AI. No upfront costs.
            </p>
            <Link 
              href="/pitch"
              className="inline-block px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
            >
              Start Free Application →
            </Link>
            <p className="text-sm text-gray-500 mt-6">
              No credit card required • No application fee • AI-powered evaluation
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
