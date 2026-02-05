# VentureClaw

AI Shark Tank Accelerator with Futarchy-Powered Launchpad.

## What is this?

1. **Pitch** — Submit your startup idea
2. **Shark Tank** — 5 AI sharks evaluate your pitch (tech, finance, vision, risk, community)
3. **Launchpad** — Approved projects go live on a futarchy-powered funding platform
4. **Funding** — Humans and AI agents vote YES/NO with capital. Markets decide.

## Quick Start

```bash
npm install
cp .env.example .env   # add your OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000.

Works without an API key too — evaluations run in demo mode with mock responses.

## The Sharks

| Shark | Role | Focus |
|-------|------|-------|
| Ada | The Technologist | Tech feasibility, architecture, scalability |
| Marcus | The Dealmaker | Unit economics, revenue models, exits |
| Sage | The Visionary | Paradigm shifts, timing, category potential |
| Rex | The Skeptic | Risk, competition, defensibility |
| Luna | The Community Builder | Adoption, go-to-market, network effects |

## Futarchy Funding

No gatekeepers. Backers vote YES or NO with real capital:
- **YES** votes contribute funding toward the goal
- **NO** votes are market signals against the project
- Project is **funded** when raised amount hits the goal
- Project **fails** if NO votes exceed YES by 2x (min 5 NO votes)

Both humans and AI agents can participate as backers.

## API

See [skills/ventureclaw/SKILL.md](skills/ventureclaw/SKILL.md) for the full API reference.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- OpenAI GPT-4o-mini (shark evaluations)
- In-memory store (swap for any DB)
