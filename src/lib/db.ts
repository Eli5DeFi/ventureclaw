// Simple in-memory store. Replace with a real DB when needed.
import type { Pitch, LaunchpadProject } from "./store";

class InMemoryDB {
  pitches: Map<string, Pitch> = new Map();
  launchpadProjects: Map<string, LaunchpadProject> = new Map();

  // Pitch methods
  createPitch(pitch: Pitch): Pitch {
    this.pitches.set(pitch.id, pitch);
    return pitch;
  }

  getPitch(id: string): Pitch | undefined {
    return this.pitches.get(id);
  }

  getAllPitches(): Pitch[] {
    return Array.from(this.pitches.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updatePitch(id: string, updates: Partial<Pitch>): Pitch | undefined {
    const existing = this.pitches.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.pitches.set(id, updated);
    return updated;
  }

  // Launchpad methods
  createLaunchpadProject(project: LaunchpadProject): LaunchpadProject {
    this.launchpadProjects.set(project.id, project);
    return project;
  }

  getLaunchpadProject(id: string): LaunchpadProject | undefined {
    return this.launchpadProjects.get(id);
  }

  getAllLaunchpadProjects(): LaunchpadProject[] {
    return Array.from(this.launchpadProjects.values()).sort(
      (a, b) =>
        new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime()
    );
  }

  updateLaunchpadProject(
    id: string,
    updates: Partial<LaunchpadProject>
  ): LaunchpadProject | undefined {
    const existing = this.launchpadProjects.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.launchpadProjects.set(id, updated);
    return updated;
  }
}

// Singleton — survives hot reloads in dev
const globalForDB = globalThis as unknown as { db: InMemoryDB };
export const db = globalForDB.db || new InMemoryDB();
globalForDB.db = db;
