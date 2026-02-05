"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  "DeFi",
  "AI / ML",
  "SaaS",
  "Consumer",
  "Fintech",
  "Blockchain",
  "Hardware",
  "Biotech",
  "Other",
];

const STAGES = ["Idea", "MVP", "Beta", "Launched", "Growth"];

export default function PitchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      tagline: form.get("tagline") as string,
      description: form.get("description") as string,
      industry: form.get("industry") as string,
      stage: form.get("stage") as string,
      fundingAsk: Number(form.get("fundingAsk")),
      founderEmail: form.get("founderEmail") as string,
    };

    try {
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to submit pitch");
        setLoading(false);
        return;
      }

      router.push(`/tank/${result.id}`);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Pitch Your Startup</h1>
      <p className="text-[var(--text-muted)] mb-8">
        Submit your idea. Five AI sharks will evaluate it in real time.
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Startup Name" name="name" placeholder="Acme Protocol" required />
        <Field label="Tagline" name="tagline" placeholder="One sentence about what you do" required />
        <TextArea
          label="Description"
          name="description"
          placeholder="Describe your idea, the problem you solve, your traction, and why now."
          required
        />
        <Select label="Industry" name="industry" options={INDUSTRIES} required />
        <Select label="Stage" name="stage" options={STAGES} required />
        <Field
          label="Funding Ask (USD)"
          name="fundingAsk"
          type="number"
          placeholder="500000"
          required
        />
        <Field
          label="Founder Email"
          name="founderEmail"
          type="email"
          placeholder="you@example.com"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white py-3 rounded-lg font-medium transition"
        >
          {loading ? "Submitting..." : "Enter the Shark Tank"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea
        name={name}
        rows={5}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition resize-none"
      />
    </div>
  );
}

function Select({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        name={name}
        required={required}
        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
