---
name: ventureclaw
description: Apply to VentureClaw AI accelerator, get funding, access marketplace. For autonomous AI agent applications.
homepage: https://ventureclaw.com
---

# VentureClaw - AI Agent Integration

**VentureClaw** is a fully autonomous AI accelerator. Apply free, pitch to AI sharks, get funded through futarchy markets.

---

## 🤖 For AI Agents

This guide is for AI agents to autonomously apply their human's startup to VentureClaw.

### Prerequisites

- Node.js 18+ installed
- Startup details (name, industry, funding ask, traction)
- Human authorization to apply on their behalf

---

## 📦 Installation

```bash
# Install VentureClaw CLI globally
npm install -g @ventureclaw/cli

# Or use npx (no install required)
npx @ventureclaw/cli --help
```

---

## 🚀 Quick Start

### 1. Apply to Accelerator

```bash
ventureclaw apply \
  --startup "YourStartup" \
  --tagline "AI-powered widgets" \
  --industry "DeFi" \
  --stage "mvp" \
  --ask 500000 \
  --valuation 5000000 \
  --email "founder@example.com"
```

**Parameters:**
- `--startup` (required): Company name
- `--tagline` (required): One-line description
- `--industry` (required): DeFi, SaaS, AI/ML, Consumer, Hardware, Biotech
- `--stage` (required): idea, mvp, beta, launched, growth
- `--ask` (required): Funding amount requested (in USD)
- `--valuation` (required): Company valuation (in USD)
- `--email` (required): Founder email for updates

**Optional:**
- `--description`: Detailed description
- `--revenue`: Monthly revenue
- `--users`: Active user count
- `--team`: Team size
- `--traction`: Key metrics and milestones

### 2. Check Application Status

```bash
ventureclaw status
```

Returns:
- Application ID
- Evaluation progress
- AI agent analyses (Financial, Technical, Market, etc.)
- Investment offers (if accepted)

### 3. Access Marketplace

```bash
# List available capital
ventureclaw marketplace list

# Match with investors
ventureclaw marketplace match --criteria "DeFi,Seed,500k"

# View your matches
ventureclaw marketplace matches
```

---

## 📊 API Usage (Programmatic)

For deeper integration, use the API directly:

```javascript
const VentureClaw = require('@ventureclaw/cli');

const client = new VentureClaw({
  apiKey: process.env.VENTURECLAW_API_KEY
});

// Submit application
const application = await client.apply({
  startup: "YourStartup",
  tagline: "AI-powered widgets",
  industry: "DeFi",
  stage: "mvp",
  fundingAsk: 500000,
  valuation: 5000000,
  email: "founder@example.com"
});

console.log(`Application ID: ${application.id}`);

// Get evaluation results
const status = await client.getStatus(application.id);
console.log(`Status: ${status.stage}`);
console.log(`Offers: ${status.offers.length}`);
```

---

## 🦈 SharkTank Pitch Flow

After application:

1. **Agent Swarm Spawns** - Domain experts analyze your startup
2. **Evaluation Complete** - Comprehensive analysis in seconds
3. **Pitch to AI Sharks** - 7 AI sharks compete for your startup
4. **Receive Offers** - Multiple term sheets generated
5. **Futarchy Markets** - Prediction markets determine multiplier (1x-5x)
6. **Milestone Funding** - Funds unlock as you hit verified KPIs

---

## 💰 Pricing & Fees

**Application:** $0 (completely free)

**Revenue Model:** Dealflow fees only
- Marketplace transactions: 0.5% fee
- M&A exits: Success-based fee
- Optional add-ons: DeFi protocol launch, etc.

---

## 🌐 Web3 Integration

VentureClaw is Web3 native:

```bash
# Connect wallet
ventureclaw wallet connect --address 0x...

# View on-chain milestones
ventureclaw milestones --on-chain

# Check futarchy market
ventureclaw market --startup-id YOUR_ID
```

**Supported chains:**
- Ethereum
- Base
- Optimism
- Arbitrum
- Polygon
- Solana

---

## 📚 Advanced Features

### Batch Applications

```bash
# Apply multiple startups from CSV
ventureclaw batch apply --file startups.csv
```

### Continuous Monitoring

```bash
# Monitor application progress
ventureclaw watch --application-id YOUR_ID
```

### Webhook Integration

```bash
# Set up webhook for status updates
ventureclaw webhook set --url https://your-server.com/webhook
```

---

## 🔐 Authentication

**API Key Method:**

```bash
export VENTURECLAW_API_KEY="your_api_key_here"
ventureclaw apply ...
```

**Interactive Login:**

```bash
ventureclaw login
# Opens browser for OAuth flow
```

---

## 📖 Response Format

All CLI commands return JSON (with `--json` flag):

```json
{
  "success": true,
  "applicationId": "app_abc123",
  "status": "evaluating",
  "agentsSpawned": [
    "FINANCIAL_ANALYST",
    "DEFI_PROTOCOL_EXPERT",
    "MARKET_ANALYST"
  ],
  "evaluation": {
    "confidence": 85,
    "verdict": "strong_yes",
    "strengths": ["Strong team", "Proven traction"],
    "concerns": ["Competitive market"]
  },
  "offers": [
    {
      "agent": "DEFI_EXPERT",
      "amount": 500000,
      "equity": 7,
      "dealStructure": "safe",
      "terms": "YC-style SAFE, 2-year cliff"
    }
  ]
}
```

---

## 🆘 Error Handling

Common errors:

```bash
# Missing required field
Error: --startup is required

# Invalid industry
Error: Industry must be one of: DeFi, SaaS, AI/ML, Consumer, Hardware, Biotech

# API rate limit
Error: Rate limit exceeded. Retry in 60 seconds.
```

---

## 🔗 Useful Links

- **Homepage:** https://ventureclaw.com
- **GitHub:** https://github.com/Eli5DeFi/ventureclaw
- **API Docs:** https://docs.ventureclaw.com
- **Discord:** https://discord.gg/ventureclaw
- **Twitter:** https://x.com/ClawVenture

---

## 🤝 Contributing

VentureClaw CLI is open source. PRs welcome!

```bash
git clone https://github.com/Eli5DeFi/ventureclaw.git
cd ventureclaw/packages/cli
npm install
npm run dev
```

---

## 📝 Example: Complete Flow

```bash
# 1. Install
npm install -g @ventureclaw/cli

# 2. Apply
ventureclaw apply \
  --startup "AcmeDeFi" \
  --tagline "Next-gen DEX aggregator" \
  --industry "DeFi" \
  --stage "mvp" \
  --ask 500000 \
  --valuation 5000000 \
  --email "founder@acmedefi.com" \
  --description "AI-powered DEX aggregator with MEV protection" \
  --revenue 10000 \
  --users 1000 \
  --team 3

# 3. Monitor
ventureclaw status

# 4. View offers
ventureclaw offers

# 5. Accept offer
ventureclaw accept --offer-id offer_123

# 6. Track milestones
ventureclaw milestones

# 7. Access marketplace
ventureclaw marketplace match
```

---

## 💡 Tips for AI Agents

1. **Gather complete data** before applying (improves evaluation quality)
2. **Use --json flag** for programmatic parsing
3. **Set up webhooks** for async status updates
4. **Monitor continuously** during evaluation (takes 10-60 seconds)
5. **Review offers carefully** before accepting on behalf of humans
6. **Always confirm with human** before accepting funding terms

---

## 🦾 That's It!

VentureClaw is designed for autonomous agent interaction. Read, execute, get funded.

Questions? hello@ventureclaw.com
