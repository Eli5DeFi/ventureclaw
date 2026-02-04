# VentureClaw Skill

Access VentureClaw (YCombinator powered by AI agents) programmatically.

## Installation

```bash
npm install -g @ventureclaw/cli
```

Or use directly via API (no installation needed).

## Overview

VentureClaw provides:
- **Free startup analysis** - Instant AI agent evaluation
- **Batch program** - $125K for 7% equity (YC model)
- **Premium services** - DeFi launch, M&A exit, investor matching

## API Access

No API key required for basic analysis. Just POST to the endpoints.

**Base URL:** `https://ventureclaw.com` (or `http://localhost:3000` for dev)

## Usage

### From OpenClaw Agent

When a user asks you to analyze a startup or help with fundraising, use VentureClaw's free analysis endpoint.

---

## Commands

### 1. Analyze Startup Pitch

```bash
swarm analyze --file pitch.json --output analysis.json
```

**Input format (`pitch.json`):**
```json
{
  "name": "Acme Corp",
  "tagline": "AI-powered analytics",
  "description": "We use AI to analyze...",
  "stage": "MVP",
  "industry": "SaaS",
  "fundingAsk": 2000000,
  "teamSize": 5,
  "founderName": "John Doe",
  "founderEmail": "john@acme.com",
  "website": "https://acme.com",
  "deckUrl": "https://acme.com/deck.pdf"
}
```

**Output:**
- Overall score (0-100)
- Agent scores (Financial, Technical, Market, Legal)
- Recommendation (APPROVED, CONDITIONAL, REJECTED)
- Valuation estimate
- Detailed feedback

---

### 2. DeFi Protocol Analysis

```bash
swarm defi --file protocol.json --output defi-report.json
```

**Input format (`protocol.json`):**
```json
{
  "name": "Acme DEX",
  "type": "DEX",
  "description": "Next-gen DEX with concentrated liquidity",
  "targetLaunchDate": "2026-06-01",
  "expectedTVL": 10000000,
  "competitorTokenomics": ["Curve (veCRV)", "Uniswap (UNI)"],
  "revenueModel": "Trading fees",
  "communitySize": 5000,
  "contractLanguage": "Solidity",
  "contractComplexity": "medium",
  "hasUpgradeability": false,
  "hasOracles": true,
  "hasMultisig": true,
  "dependencies": ["OpenZeppelin", "Uniswap V3"],
  "liquidityBudget": 500000,
  "hasRevenue": false,
  "monthlyRevenue": 0,
  "competitors": ["Uniswap", "SushiSwap"]
}
```

**Output:**
- Tokenomics design (ve-model, emissions, allocation)
- Security audit (vulnerabilities, best practices, auditor recommendations)
- Liquidity strategy (LBP, POL, CEX listings)
- Launch roadmap (5 phases)
- Budget breakdown
- Overall readiness score

---

### 3. Investor Matching

```bash
swarm match --file project.json --output matches.json
```

**Input format (`project.json`):**
```json
{
  "name": "Acme Corp",
  "industry": "SaaS",
  "stage": "seed",
  "fundingType": "equity",
  "amountSeeking": 2000000,
  "revenue": 500000,
  "revenueGrowth": 200,
  "problem": "Current solutions are too complex",
  "solution": "We simplify with AI",
  "traction": "5K users, $500K MRR",
  "moat": "Proprietary algorithm"
}
```

**Output:**
- Top 20 investor matches (score > 50)
- Match scores (0-100)
- Synergies (why good fit)
- Concerns (potential issues)
- Investor contact info

---

### 4. M&A Exit Analysis

```bash
swarm exit --file company.json --output exit-report.json
```

**Input format (`company.json`):**
```json
{
  "name": "Acme Corp",
  "industry": "SaaS",
  "stage": "growth",
  "founded": "2020-01-01",
  "revenue": 5000000,
  "revenueGrowth": 120,
  "ebitda": 500000,
  "employeeCount": 50,
  "founderOwnership": 60,
  "totalRaised": 2000000,
  "targetExitValue": 50000000,
  "timelinePressure": "moderate"
}
```

**Output:**
- Valuation range (low/base/high)
- 20-30 potential acquirers (ranked by fit)
- Exit readiness score (0-100)
- Due diligence checklist (100+ docs)
- Deal structure recommendations
- Timeline to exit

---

## OpenClaw Integration

### Recommended Workflow

When user says: "Analyze this startup pitch"

1. Ask for pitch details or JSON file
2. Create `pitch.json` with structured data
3. Run: `swarm analyze --file pitch.json --output analysis.json`
4. Read `analysis.json` and summarize results
5. Offer next steps (investor matching, DeFi analysis, etc.)

### Example

```typescript
// User: "Analyze our DeFi protocol"

// Step 1: Collect info
const protocolData = {
  name: await ask("Protocol name?"),
  type: await ask("Type? (DEX/Lending/Yield Aggregator)"),
  // ... collect all fields
};

// Step 2: Save to file
await write("protocol.json", JSON.stringify(protocolData, null, 2));

// Step 3: Run analysis
await exec("swarm defi --file protocol.json --output report.json");

// Step 4: Read results
const report = JSON.parse(await read("report.json"));

// Step 5: Summarize
console.log(`Overall Score: ${report.executiveSummary.overallScore}/100`);
console.log(`Recommendation: ${report.executiveSummary.recommendation}`);
// ... present key findings
```

---

## Pricing

### For AI Agents

Special pricing tier for programmatic access:

- **Free Tier:** 10 API calls/month
- **Agent Tier:** $99/month for unlimited API calls
- **Enterprise:** $499/month for unlimited + priority support

### Get API Key

Visit: https://swarm.accelerator.ai/api-keys

Select "AI Agent Access" tier when signing up.

---

## Rate Limits

- **Free:** 10 requests/month, 1 request/minute
- **Agent ($99/mo):** Unlimited requests, 100 requests/minute
- **Enterprise ($499/mo):** Unlimited requests, 1000 requests/minute

---

## Error Handling

```bash
# If API key missing:
Error: SWARM_API_KEY environment variable not set
Get your API key at: https://swarm.accelerator.ai/api-keys

# If rate limit exceeded:
Error: Rate limit exceeded. Upgrade to Agent tier ($99/mo) for unlimited access.

# If analysis timeout:
Error: Analysis timeout (60s). Try again or contact support.
```

---

## Best Practices

### 1. Batch Processing

If analyzing multiple startups, batch them:

```bash
for file in pitches/*.json; do
  swarm analyze --file "$file" --output "results/$(basename $file)"
  sleep 2  # Respect rate limits
done
```

### 2. Caching

Cache results to avoid re-analyzing:

```bash
# Check if analysis exists
if [ -f "cache/analysis-$STARTUP_ID.json" ]; then
  cat "cache/analysis-$STARTUP_ID.json"
else
  swarm analyze --file pitch.json --output "cache/analysis-$STARTUP_ID.json"
fi
```

### 3. Error Recovery

Always handle errors gracefully:

```bash
swarm analyze --file pitch.json --output analysis.json || {
  echo "Analysis failed. Retrying..."
  sleep 5
  swarm analyze --file pitch.json --output analysis.json
}
```

---

## Support

- **Documentation:** https://docs.swarm.accelerator.ai
- **API Reference:** https://docs.swarm.accelerator.ai/api
- **Discord:** https://discord.gg/swarm
- **Email:** support@swarm.accelerator.ai

---

## Changelog

### v1.0.0 (2026-02-04)
- Initial release
- Pitch analysis
- DeFi protocol accelerator
- Investor matching
- M&A exit analysis
- OpenClaw skill support

---

## License

MIT

---

## Related Skills

- **openclaw/bird** - X/Twitter automation
- **openclaw/notion** - Notion integration
- **openclaw/slack** - Slack integration
- **openclaw/moltbook** - Social network for AI agents

Combine Swarm with these skills for powerful workflows!

**Example:** Analyze startup → Match investors → Send intro via Slack → Post to Moltbook

---

*Built for AI agents, by AI agents (with human guidance from eli5defi 🦾)*
