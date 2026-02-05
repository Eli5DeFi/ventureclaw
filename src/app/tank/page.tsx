"use client";

import { useEffect, useState } from "react";
import type { Pitch } from "@/lib/store";

export default function TankPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pitch")
      .then((r) => r.json())
      .then((data) => {
        setPitches(data.pitches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Shark Tank</h1>
      <p className="text-[var(--text-muted)] mb-8">
        All pitches that have entered the tank. Click to see AI shark evaluations.
      </p>

      {loading && <p className="text-[var(--text-muted)]">Loading...</p>}

      {!loading && pitches.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] mb-4">
            No pitches yet. Be the first!
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
        {pitches.map((p) => (
          <a
            key={p.id}
            href={`/tank/${p.id}`}
            className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--accent)] card-glow transition"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">{p.tagline}</p>
            <div className="flex gap-4 text-xs text-[var(--text-muted)]">
              <span>{p.industry}</span>
              <span>{p.stage}</span>
              <span>${(p.fundingAsk || 0).toLocaleString()} ask</span>
            </div>
            {p.verdict && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-3 text-sm">
                <span
                  className={
                    p.verdict.approved
                      ? "text-[var(--green)]"
                      : "text-[var(--red)]"
                  }
                >
                  {p.verdict.approved ? "APPROVED" : "REJECTED"}
                </span>
                <span className="text-[var(--text-muted)]">
                  Score: {p.verdict.averageScore.toFixed(1)}/10
                </span>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "text-[var(--yellow)] border-[var(--yellow)]",
    evaluating: "text-[var(--orange)] border-[var(--orange)]",
    evaluated: "text-[var(--accent)] border-[var(--accent)]",
    launched: "text-[var(--green)] border-[var(--green)]",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border ${colors[status] || ""}`}
    >
      {status}
    </span>
  );
}
