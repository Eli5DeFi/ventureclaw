"use client";

import { useEffect, useState } from "react";
import type { LaunchpadProject } from "@/lib/store";

export default function LaunchpadPage() {
  const [projects, setProjects] = useState<LaunchpadProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/launchpad")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Futarchy Launchpad</h1>
      <p className="text-[var(--text-muted)] mb-8">
        AI-approved projects seeking funding. Vote YES or NO with capital.
        Markets decide who gets funded.
      </p>

      {loading && <p className="text-[var(--text-muted)]">Loading...</p>}

      {!loading && projects.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] mb-4">
            No projects on the launchpad yet. Pitch your idea first!
          </p>
          <a
            href="/pitch"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            Submit a Pitch
          </a>
        </div>
      )}

      <div className="space-y-4">
        {projects.map((p) => (
          <a
            key={p.id}
            href={`/launchpad/${p.id}`}
            className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--accent)] card-glow transition"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <LaunchStatus status={p.status} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">{p.tagline}</p>

            {/* Funding bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                <span>
                  ${p.fundingRaised.toLocaleString()} raised
                </span>
                <span>${p.fundingGoal.toLocaleString()} goal</span>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (p.fundingRaised / p.fundingGoal) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Futarchy votes */}
            <div className="flex gap-4 text-sm">
              <span className="text-[var(--green)]">
                YES: {p.yesVotes}
              </span>
              <span className="text-[var(--red)]">
                NO: {p.noVotes}
              </span>
              <span className="text-[var(--text-muted)]">
                {p.backers.length} backers
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function LaunchStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "text-[var(--green)] border-[var(--green)]",
    funded: "text-[var(--accent)] border-[var(--accent)]",
    failed: "text-[var(--red)] border-[var(--red)]",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${colors[status] || ""}`}>
      {status}
    </span>
  );
}
