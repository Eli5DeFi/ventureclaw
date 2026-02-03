import type { Startup } from "@prisma/client";

// Agent capability types
export type AgentCapability = 
  | "financial_analysis"
  | "technical_dd"
  | "market_research"
  | "legal_compliance"
  // Industry-specific
  | "blockchain_analysis"
  | "ai_ml_evaluation"
  | "healthcare_compliance"
  | "fintech_regulation"
  | "climate_impact"
  | "hardware_manufacturing"
  | "biotech_science"
  | "gaming_monetization"
  | "ecommerce_logistics"
  | "education_pedagogy"
  // Cross-cutting
  | "security_audit"
  | "data_privacy"
  | "team_dynamics"
  | "competitive_intelligence"
  | "patent_search"
  | "go_to_market"
  | "pricing_strategy"
  | "fundraising_strategy";

export interface AgentDefinition {
  id: string;
  name: string;
  capability: AgentCapability;
  description: string;
  priority: number; // 1-10, higher = more important
  cost: number; // Estimated OpenAI cost
  industryFocus?: string[];
  stageFocus?: string[];
  spawnConditions?: (startup: Startup) => boolean;
}

// Core agents - always run
export const CORE_AGENTS: AgentDefinition[] = [
  {
    id: "financial-analyst",
    name: "Financial Analyst",
    capability: "financial_analysis",
    description: "Analyzes revenue models, burn rate, and financial viability",
    priority: 10,
    cost: 0.60,
  },
  {
    id: "technical-dd",
    name: "Technical Due Diligence",
    capability: "technical_dd",
    description: "Evaluates tech stack, scalability, and security",
    priority: 9,
    cost: 0.55,
  },
  {
    id: "market-research",
    name: "Market Research",
    capability: "market_research",
    description: "Analyzes TAM, competition, and market timing",
    priority: 9,
    cost: 0.65,
  },
  {
    id: "legal-compliance",
    name: "Legal & Compliance",
    capability: "legal_compliance",
    description: "Reviews regulatory requirements and corporate structure",
    priority: 8,
    cost: 0.50,
  },
];

// Industry-specific agents - spawn conditionally
export const INDUSTRY_AGENTS: AgentDefinition[] = [
  {
    id: "blockchain-expert",
    name: "Blockchain & Web3 Expert",
    capability: "blockchain_analysis",
    description: "Deep analysis of tokenomics, smart contracts, and crypto economics",
    priority: 8,
    cost: 0.70,
    industryFocus: ["Blockchain / Web3", "DeFi", "NFT", "DAO"],
    spawnConditions: (startup) => 
      startup.industry.toLowerCase().includes("blockchain") ||
      startup.industry.toLowerCase().includes("web3") ||
      startup.industry.toLowerCase().includes("crypto") ||
      startup.description.toLowerCase().includes("token") ||
      startup.description.toLowerCase().includes("smart contract"),
  },
  {
    id: "ai-ml-specialist",
    name: "AI/ML Specialist",
    capability: "ai_ml_evaluation",
    description: "Evaluates AI models, data strategy, and ML infrastructure",
    priority: 8,
    cost: 0.70,
    industryFocus: ["AI / Machine Learning", "Data Science", "Computer Vision", "NLP"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("ai") ||
      startup.industry.toLowerCase().includes("machine learning") ||
      startup.description.toLowerCase().includes("llm") ||
      startup.description.toLowerCase().includes("neural network"),
  },
  {
    id: "healthcare-specialist",
    name: "Healthcare Compliance Expert",
    capability: "healthcare_compliance",
    description: "HIPAA, FDA approval, clinical trials, healthcare regulations",
    priority: 9,
    cost: 0.65,
    industryFocus: ["HealthTech", "Biotech", "Medical Devices", "Telehealth"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("health") ||
      startup.industry.toLowerCase().includes("medical") ||
      startup.industry.toLowerCase().includes("biotech") ||
      startup.description.toLowerCase().includes("hipaa") ||
      startup.description.toLowerCase().includes("fda"),
  },
  {
    id: "fintech-regulator",
    name: "FinTech Regulatory Expert",
    capability: "fintech_regulation",
    description: "Banking regulations, KYC/AML, payment processing compliance",
    priority: 9,
    cost: 0.65,
    industryFocus: ["FinTech", "Payments", "Banking", "Insurance"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("fintech") ||
      startup.industry.toLowerCase().includes("payment") ||
      startup.industry.toLowerCase().includes("banking") ||
      startup.description.toLowerCase().includes("kyc") ||
      startup.description.toLowerCase().includes("financial"),
  },
  {
    id: "climate-impact",
    name: "Climate Impact Analyst",
    capability: "climate_impact",
    description: "Carbon footprint, sustainability metrics, climate tech viability",
    priority: 7,
    cost: 0.60,
    industryFocus: ["Climate Tech", "Clean Energy", "Sustainability"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("climate") ||
      startup.industry.toLowerCase().includes("clean energy") ||
      startup.industry.toLowerCase().includes("sustainability") ||
      startup.description.toLowerCase().includes("carbon") ||
      startup.description.toLowerCase().includes("renewable"),
  },
  {
    id: "hardware-manufacturing",
    name: "Hardware Manufacturing Expert",
    capability: "hardware_manufacturing",
    description: "Supply chain, manufacturing feasibility, hardware economics",
    priority: 7,
    cost: 0.60,
    industryFocus: ["Hardware", "IoT", "Robotics", "Consumer Electronics"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("hardware") ||
      startup.industry.toLowerCase().includes("iot") ||
      startup.industry.toLowerCase().includes("robotics") ||
      startup.description.toLowerCase().includes("manufacture") ||
      startup.description.toLowerCase().includes("physical product"),
  },
  {
    id: "biotech-scientist",
    name: "Biotech Science Advisor",
    capability: "biotech_science",
    description: "Evaluates scientific validity, research methodology, biotech IP",
    priority: 8,
    cost: 0.70,
    industryFocus: ["Biotech", "Pharma", "Life Sciences"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("biotech") ||
      startup.industry.toLowerCase().includes("pharma") ||
      startup.description.toLowerCase().includes("clinical") ||
      startup.description.toLowerCase().includes("molecule"),
  },
  {
    id: "gaming-monetization",
    name: "Gaming Monetization Expert",
    capability: "gaming_monetization",
    description: "F2P economics, player retention, gaming market analysis",
    priority: 6,
    cost: 0.55,
    industryFocus: ["Gaming", "Esports", "Game Development"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("gaming") ||
      startup.industry.toLowerCase().includes("game") ||
      startup.industry.toLowerCase().includes("esports"),
  },
  {
    id: "ecommerce-logistics",
    name: "E-Commerce & Logistics Expert",
    capability: "ecommerce_logistics",
    description: "Supply chain optimization, fulfillment, marketplace dynamics",
    priority: 6,
    cost: 0.55,
    industryFocus: ["E-Commerce", "Marketplace", "Retail"],
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("commerce") ||
      startup.industry.toLowerCase().includes("marketplace") ||
      startup.industry.toLowerCase().includes("retail") ||
      startup.description.toLowerCase().includes("logistics"),
  },
];

// Cross-cutting agents - spawn based on specific needs
export const SPECIALIST_AGENTS: AgentDefinition[] = [
  {
    id: "security-auditor",
    name: "Security Audit Specialist",
    capability: "security_audit",
    description: "Deep security analysis, penetration testing, vulnerability assessment",
    priority: 8,
    cost: 0.60,
    spawnConditions: (startup) =>
      startup.fundingAsk > 5000000 || // High value = high security risk
      startup.industry.toLowerCase().includes("fintech") ||
      startup.industry.toLowerCase().includes("blockchain") ||
      startup.industry.toLowerCase().includes("health"),
  },
  {
    id: "data-privacy-expert",
    name: "Data Privacy Expert",
    capability: "data_privacy",
    description: "GDPR, CCPA, data handling, privacy regulations",
    priority: 7,
    cost: 0.55,
    spawnConditions: (startup) =>
      startup.description.toLowerCase().includes("user data") ||
      startup.description.toLowerCase().includes("personal information") ||
      startup.industry.toLowerCase().includes("health") ||
      startup.industry.toLowerCase().includes("fintech"),
  },
  {
    id: "team-psychologist",
    name: "Team Dynamics Analyst",
    capability: "team_dynamics",
    description: "Founder compatibility, team balance, organizational health",
    priority: 5,
    cost: 0.50,
    stageFocus: ["IDEA", "MVP"],
    spawnConditions: (startup) =>
      startup.teamSize >= 5 && startup.stage === "IDEA",
  },
  {
    id: "competitive-intel",
    name: "Competitive Intelligence",
    capability: "competitive_intelligence",
    description: "Deep competitor analysis, market positioning, differentiation strategy",
    priority: 6,
    cost: 0.60,
    spawnConditions: (startup) =>
      startup.fundingAsk > 2000000, // Only for larger rounds
  },
  {
    id: "patent-searcher",
    name: "Patent Search Specialist",
    capability: "patent_search",
    description: "Prior art search, IP landscape analysis, patent strategy",
    priority: 6,
    cost: 0.55,
    spawnConditions: (startup) =>
      startup.industry.toLowerCase().includes("biotech") ||
      startup.industry.toLowerCase().includes("hardware") ||
      startup.description.toLowerCase().includes("patent") ||
      startup.description.toLowerCase().includes("invention"),
  },
  {
    id: "gtm-strategist",
    name: "Go-to-Market Strategist",
    capability: "go_to_market",
    description: "Launch strategy, channel optimization, growth tactics",
    priority: 7,
    cost: 0.60,
    stageFocus: ["MVP", "GROWTH"],
    spawnConditions: (startup) =>
      startup.stage === "MVP" || startup.stage === "GROWTH",
  },
];

// Dynamic agent selection logic
export function selectAgents(startup: Startup): AgentDefinition[] {
  const selectedAgents: AgentDefinition[] = [...CORE_AGENTS];
  
  // Add industry-specific agents
  for (const agent of INDUSTRY_AGENTS) {
    if (agent.spawnConditions && agent.spawnConditions(startup)) {
      selectedAgents.push(agent);
    }
  }
  
  // Add specialist agents based on conditions
  for (const agent of SPECIALIST_AGENTS) {
    if (agent.spawnConditions && agent.spawnConditions(startup)) {
      selectedAgents.push(agent);
    }
  }
  
  // Sort by priority (higher first)
  selectedAgents.sort((a, b) => b.priority - a.priority);
  
  return selectedAgents;
}

// Estimate total cost
export function estimateCost(agents: AgentDefinition[]): number {
  return agents.reduce((sum, agent) => sum + agent.cost, 0);
}

// Get agent count breakdown
export function getAgentBreakdown(startup: Startup) {
  const agents = selectAgents(startup);
  
  return {
    total: agents.length,
    core: agents.filter(a => CORE_AGENTS.includes(a)).length,
    industry: agents.filter(a => INDUSTRY_AGENTS.includes(a)).length,
    specialist: agents.filter(a => SPECIALIST_AGENTS.includes(a)).length,
    estimatedCost: estimateCost(agents),
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      capability: a.capability,
      priority: a.priority,
    })),
  };
}
