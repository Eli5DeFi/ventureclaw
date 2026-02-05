"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { LaunchpadProject, Backer } from "@/lib/store";

export default function LaunchpadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<LaunchpadProject | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [vote, setVote] = useState<"yes" | "no">("yes");
  const [backerType, setBackerType] = useState<"human" | "ai-agent">("human");
  const [backerName, setBackerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/launchpad?id=${id}`)
      .then((r) => r.json())
      .then((data) => setProject(data.project || null))
      .catch(() => setError("Failed to load project"));
  }, [id]);

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/launchpad/${id}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: backerName || (backerType === "ai-agent" ? "AI Agent" : "Anonymous"),
          type: backerType,
          amount: Number(fundAmount),
          vote,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setProject(result.project);
        setFundAmount("");
        setBackerName("");
      } else {
        setError(result.error || "Funding failed");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-[var(--text-muted)]">
        {error || "Loading..."}
      </div>
    );
  }

  const pctFunded = Math.min(100, (project.fundingRaised / project.fundingGoal) * 100);
  const totalVotes = project.yesVotes + project.noVotes;
  const yesPct = totalVotes > 0 ? (project.yesVotes / totalVotes) * 100 : 50;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <span
            className={`text-xs px-2 py-0.5 rounded border ${
              project.status === "active"
                ? "text-[var(--green)] border-[var(--green)]"
                : project.status === "funded"
                ? "text-[var(--accent)] border-[var(--accent)]"
                : "text-[var(--red)] border-[var(--red)]"
            }`}
          >
            {project.status}
          </span>
        </div>
        <p className="text-lg text-[var(--text-muted)]">{project.tagline}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Funding Progress */}
        <div className="md:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="font-semibold mb-4">Funding Progress</h2>
          <div className="flex justify-between text-sm mb-1">
            <span>${project.fundingRaised.toLocaleString()}</span>
            <span className="text-[var(--text-muted)]">
              of ${project.fundingGoal.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all"
              style={{ width: `${pctFunded}%` }}
            />
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            {project.description}
          </p>
        </div>

        {/* Futarchy Market */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="font-semibold mb-4">Futarchy Market</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--green)]">YES</span>
                <span>{yesPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--green)] rounded-full"
                  style={{ width: `${yesPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--red)]">NO</span>
                <span>{(100 - yesPct).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--red)] rounded-full"
                  style={{ width: `${100 - yesPct}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
              {totalVotes} total votes &middot; {project.backers.length} backers
            </div>
          </div>
        </div>
      </div>

      {/* Fund Form */}
      {project.status === "active" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-4">Back This Project</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleFund} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <input
                  value={backerName}
                  onChange={(e) => setBackerName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Backer Type
                </label>
                <select
                  value={backerType}
                  onChange={(e) =>
                    setBackerType(e.target.value as "human" | "ai-agent")
                  }
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition"
                >
                  <option value="human">Human</option>
                  <option value="ai-agent">AI Agent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount (USD)
              </label>
              <input
                type="number"
                min="1"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="1000"
                required
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Vote
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVote("yes")}
                  className={`flex-1 py-2.5 rounded-lg border font-medium transition ${
                    vote === "yes"
                      ? "bg-green-900/30 border-[var(--green)] text-[var(--green)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--green)]"
                  }`}
                >
                  YES — Fund This
                </button>
                <button
                  type="button"
                  onClick={() => setVote("no")}
                  className={`flex-1 py-2.5 rounded-lg border font-medium transition ${
                    vote === "no"
                      ? "bg-red-900/30 border-[var(--red)] text-[var(--red)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--red)]"
                  }`}
                >
                  NO — Don&apos;t Fund
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white py-3 rounded-lg font-medium transition"
            >
              {submitting ? "Submitting..." : "Submit Vote & Funding"}
            </button>
          </form>
        </div>
      )}

      {/* Backers List */}
      {project.backers.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">Backers</h2>
          <div className="space-y-2">
            {project.backers.map((b) => (
              <BackerRow key={b.id} backer={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BackerRow({ backer }: { backer: Backer }) {
  return (
    <div className="flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm">
      <div className="flex items-center gap-3">
        <span>{backer.type === "ai-agent" ? "🤖" : "👤"}</span>
        <span>{backer.name}</span>
        <span className="text-xs text-[var(--text-muted)]">{backer.type}</span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={
            backer.vote === "yes"
              ? "text-[var(--green)]"
              : "text-[var(--red)]"
          }
        >
          {backer.vote.toUpperCase()}
        </span>
        <span className="font-medium">${backer.amount.toLocaleString()}</span>
      </div>
    </div>
  );
}
