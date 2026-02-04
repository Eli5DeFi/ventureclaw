import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Startup {
    id: string;
    name: string;
    tagline: string;
    description: string;
    stage: 'idea' | 'mvp' | 'growth' | 'scale';
    industry: string;
    fundingAsk: number;
    teamSize: number;
    founderName: string;
    founderEmail: string;
    website?: string;
    deckUrl?: string;
    pitchVideo?: string;
    createdAt: Date;
    status: 'pending' | 'analyzing' | 'approved' | 'rejected' | 'conditional';
    analysis?: AgentAnalysis;
}

export interface AgentAnalysis {
    financial: AgentScore;
    technical: AgentScore;
    market: AgentScore;
    legal: AgentScore;
    vcAgents: VCAgentScore[];
    overallScore: number;
    valuation: number;
    fundingRecommendation: 'approved' | 'rejected' | 'conditional';
    summary: string;
    completedAt: Date;
}

export interface AgentScore {
    agentName: string;
    score: number; // 0-100
    confidence: number; // 0-100
    feedback: string[];
    strengths: string[];
    concerns: string[];
}

export interface VCAgentScore {
    vcId: string;
    vcName: string;
    interested: boolean;
    interestLevel: number; // 0-100
    feedback: string;
}

export interface VC {
    id: string;
    name: string;
    firmName: string;
    email: string;
    fundSize: string;
    focusAreas: string[];
    stagePreference: string[];
    investmentRange: { min: number; max: number };
    thesis: string;
    portfolio: string[];
    createdAt: Date;
    agentPersona?: VCAgentPersona;
}

export interface VCAgentPersona {
    name: string;
    personality: string;
    investmentStyle: string;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    priorities: string[];
}

// Store State
interface AppState {
    // Startups
    startups: Startup[];
    addStartup: (startup: Omit<Startup, 'id' | 'createdAt' | 'status'>) => Promise<string>;
    updateStartup: (id: string, updates: Partial<Startup>) => void;
    getStartup: (id: string) => Startup | undefined;

    // VCs
    vcs: VC[];
    addVC: (vc: Omit<VC, 'id' | 'createdAt'>) => string;
    updateVC: (id: string, updates: Partial<VC>) => void;
    getVC: (id: string) => VC | undefined;

    // Analysis
    analyzeStartup: (startupId: string) => Promise<AgentAnalysis>;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Create Store
export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            startups: [],
            vcs: [],

            addStartup: async (startup) => {
                try {
                    const response = await fetch('/api/pitches', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(startup),
                    });
                    
                    const result = await response.json();
                    
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to submit pitch');
                    }
                    
                    // Add to local state
                    const newStartup: Startup = {
                        ...startup,
                        id: result.startupId,
                        createdAt: new Date(),
                        status: 'pending',
                    };
                    set((state) => ({ startups: [...state.startups, newStartup] }));
                    
                    return result.startupId;
                } catch (error) {
                    console.error('Failed to submit pitch:', error);
                    throw error;
                }
            },

            updateStartup: (id, updates) => {
                set((state) => ({
                    startups: state.startups.map((s) =>
                        s.id === id ? { ...s, ...updates } : s
                    ),
                }));
            },

            getStartup: (id) => {
                return get().startups.find((s) => s.id === id);
            },

            addVC: (vc) => {
                const id = generateId();
                const newVC: VC = {
                    ...vc,
                    id,
                    createdAt: new Date(),
                };
                set((state) => ({ vcs: [...state.vcs, newVC] }));
                return id;
            },

            updateVC: (id, updates) => {
                set((state) => ({
                    vcs: state.vcs.map((v) =>
                        v.id === id ? { ...v, ...updates } : v
                    ),
                }));
            },

            getVC: (id) => {
                return get().vcs.find((v) => v.id === id);
            },

            // Real AI analysis function
            analyzeStartup: async (startupId) => {
                const startup = get().getStartup(startupId);
                if (!startup) throw new Error('Startup not found');

                // Set status to analyzing
                get().updateStartup(startupId, { status: 'analyzing' });

                try {
                    // Trigger real AI analysis
                    const response = await fetch(`/api/pitches/${startupId}/analyze`, {
                        method: 'POST',
                    });
                    
                    const result = await response.json();
                    
                    if (!result.success) {
                        throw new Error(result.error || 'Analysis failed');
                    }
                    
                    // Extract analysis data
                    const analysisData = result.data;
                    const synthesis = analysisData.synthesis;

                    // Build analysis object from API response
                    const analysis: AgentAnalysis = {
                        financial: {
                            agentName: 'Financial Analyst',
                            score: analysisData.financial.score,
                            confidence: analysisData.financial.confidence,
                            feedback: analysisData.financial.feedback,
                            strengths: analysisData.financial.strengths,
                            concerns: analysisData.financial.concerns,
                        },
                        technical: {
                            agentName: 'Technical Due Diligence',
                            score: analysisData.technical.score,
                            confidence: analysisData.technical.confidence,
                            feedback: analysisData.technical.feedback,
                            strengths: analysisData.technical.strengths,
                            concerns: analysisData.technical.concerns,
                        },
                        market: {
                            agentName: 'Market Research',
                            score: analysisData.market.score,
                            confidence: analysisData.market.confidence,
                            feedback: analysisData.market.feedback,
                            strengths: analysisData.market.strengths,
                            concerns: analysisData.market.concerns,
                        },
                        legal: {
                            agentName: 'Legal & Compliance',
                            score: analysisData.legal.score,
                            confidence: analysisData.legal.confidence,
                            feedback: analysisData.legal.feedback,
                            strengths: analysisData.legal.strengths,
                            concerns: analysisData.legal.concerns,
                        },
                        vcAgents: [], // Will be populated by VC matching later
                        overallScore: synthesis.overallScore,
                        valuation: synthesis.valuation,
                        fundingRecommendation: synthesis.recommendation.toLowerCase() as 'approved' | 'rejected' | 'conditional',
                        summary: synthesis.summary,
                        completedAt: new Date(),
                    };

                    // Update startup with analysis
                    get().updateStartup(startupId, {
                        status: synthesis.recommendation.toLowerCase(),
                        analysis
                    });

                    return analysis;
                } catch (error) {
                    // Revert status on error
                    get().updateStartup(startupId, { status: 'pending' });
                    throw error;
                }
            },
        }),
        {
            name: 'ventureclaw-store',
        }
    )
);
