import { create } from "zustand";

export interface Pitch {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  stage: string;
  fundingAsk: number;
  founderEmail: string;
  createdAt: string;
  status: "pending" | "evaluating" | "evaluated" | "launched";
  evaluations?: SharkEvaluation[];
  verdict?: Verdict;
}

export interface SharkEvaluation {
  sharkId: string;
  score: number;
  analysis: string;
  strengths: string[];
  concerns: string[];
  decision: "fund" | "pass" | "conditional";
  fundingOffer?: number;
}

export interface Verdict {
  approved: boolean;
  averageScore: number;
  fundingApproved: number;
  summary: string;
}

export interface LaunchpadProject {
  id: string;
  pitchId: string;
  name: string;
  tagline: string;
  description: string;
  fundingGoal: number;
  fundingRaised: number;
  yesVotes: number;
  noVotes: number;
  backers: Backer[];
  status: "active" | "funded" | "failed";
  launchedAt: string;
  deadline: string;
}

export interface Backer {
  id: string;
  name: string;
  type: "human" | "ai-agent";
  amount: number;
  vote: "yes" | "no";
  timestamp: string;
}

interface AppState {
  pitches: Pitch[];
  launchpadProjects: LaunchpadProject[];
  addPitch: (pitch: Pitch) => void;
  updatePitch: (id: string, updates: Partial<Pitch>) => void;
  addLaunchpadProject: (project: LaunchpadProject) => void;
  updateLaunchpadProject: (id: string, updates: Partial<LaunchpadProject>) => void;
}

export const useStore = create<AppState>((set) => ({
  pitches: [],
  launchpadProjects: [],
  addPitch: (pitch) =>
    set((state) => ({ pitches: [...state.pitches, pitch] })),
  updatePitch: (id, updates) =>
    set((state) => ({
      pitches: state.pitches.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  addLaunchpadProject: (project) =>
    set((state) => ({
      launchpadProjects: [...state.launchpadProjects, project],
    })),
  updateLaunchpadProject: (id, updates) =>
    set((state) => ({
      launchpadProjects: state.launchpadProjects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
}));
