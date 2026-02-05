"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Pitch, SharkEvaluation } from "@/lib/store";
import { SHARKS } from "@/lib/sharks/profiles";

export default function TankDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [currentShark, setCurrentShark] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/pitch?id=${id}`)
      .then((r) => r.json())
      .then((data) => setPitch(data.pitch || null))
      .catch(() => setError("Failed to load pitch"));
  }, [id]);

  async function startEvaluation() {
    if (!pitch) return;
    setEvaluating(true);
    setError("");

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId: pitch.id }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Evaluation failed");
        setEvaluating(false);
        return;
      }

      setPitch(result.pitch);
    } catch {
      setError("Network error during evaluation");
    }
    setEvaluating(false);
  }

  async function launchOnPad() {
    if (!pitch) return;
    try {
      const res = await fetch("/api/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId: pitch.id }),
      });
      const result = await res.json();
      if (res.ok) {
        router.push(`/launchpad/${result.project.id}`);
      } else {
        setError(result.error || "Failed to launch");
      }
    } catch {
      setError("Network error");
    }
  }

  if (!pitch) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-[var(--text-muted)]">
        {error || "Loading..."}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{pitch.name}</h1>
          <span className="text-xs px-2 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)]">
            {pitch.status}
          </span>
        </div>
        <p className="text-lg text-[var(--text-muted)]">{pitch.tagline}</p>
      </div>

      {/* Pitch Details */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 mb-8">
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Industry:</span>{" "}
            {pitch.industry}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Stage:</span>{" "}
            {pitch.stage}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Ask:</span> $
            {pitch.fundingAsk.toLocaleString()}
          </div>
        </div>
        <p className="text-sm leading-relaxed">{pitch.description}</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Start Evaluation */}
      {pitch.status === "pending" && (
        <button
          onClick={startEvaluation}
          disabled={evaluating}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white py-3 rounded-lg font-medium transition mb-8"
        >
          {evaluating
            ? `Shark ${currentShark} is evaluating...`
            : "Start Shark Tank Evaluation"}
        </button>
      )}

      {/* Evaluations */}
      {pitch.evaluations && pitch.evaluations.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold">Shark Evaluations</h2>
          {pitch.evaluations.map((ev) => (
            <SharkCard key={ev.sharkId} evaluation={ev} />
          ))}
        </div>
      )}

      {/* Verdict */}
      {pitch.verdict && (
        <div
          className={`border rounded-lg p-6 mb-8 ${
            pitch.verdict.approved
              ? "border-[var(--green)] bg-green-900/10"
              : "border-[var(--red)] bg-red-900/10"
          }`}
        >
          <h2 className="text-2xl font-bold mb-2">
            {pitch.verdict.approved
              ? "APPROVED FOR LAUNCHPAD"
              : "NOT APPROVED"}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            {pitch.verdict.summary}
          </p>
          <div className="flex gap-6 text-sm">
            <span>
              Average Score:{" "}
              <strong>{pitch.verdict.averageScore.toFixed(1)}/10</strong>
            </span>
            {pitch.verdict.approved && (
              <span>
                Funding Approved: $
                <strong>
                  {pitch.verdict.fundingApproved.toLocaleString()}
                </strong>
              </span>
            )}
          </div>

          {pitch.verdict.approved && pitch.status === "evaluated" && (
            <button
              onClick={launchOnPad}
              className="mt-4 bg-[var(--green)] hover:brightness-110 text-white px-6 py-2.5 rounded-lg font-medium transition"
            >
              Launch on Futarchy Launchpad
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SharkCard({ evaluation }: { evaluation: SharkEvaluation }) {
  const shark = SHARKS.find((s) => s.id === evaluation.sharkId);
  if (!shark) return null;

  const decisionColors: Record<string, string> = {
    fund: "text-[var(--green)]",
    pass: "text-[var(--red)]",
    conditional: "text-[var(--yellow)]",
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{shark.avatar}</span>
          <div>
            <span className="font-semibold">{shark.name}</span>
            <span className="text-xs text-[var(--text-muted)] ml-2">
              {shark.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{evaluation.score}/10</span>
          <span
            className={`text-sm font-semibold uppercase ${
              decisionColors[evaluation.decision]
            }`}
          >
            {evaluation.decision === "fund"
              ? "I'M IN"
              : evaluation.decision === "pass"
              ? "I'M OUT"
              : "CONDITIONAL"}
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-3">{evaluation.analysis}</p>

      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-[var(--green)] text-xs font-medium">
            STRENGTHS
          </span>
          <ul className="mt-1 space-y-1">
            {evaluation.strengths.map((s, i) => (
              <li key={i} className="text-[var(--text-muted)]">
                + {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="text-[var(--red)] text-xs font-medium">
            CONCERNS
          </span>
          <ul className="mt-1 space-y-1">
            {evaluation.concerns.map((c, i) => (
              <li key={i} className="text-[var(--text-muted)]">
                - {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {evaluation.fundingOffer && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] text-sm">
          Offer: <strong>${evaluation.fundingOffer.toLocaleString()}</strong>
        </div>
      )}
    </div>
  );
}
