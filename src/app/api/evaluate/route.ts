import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SHARKS } from "@/lib/sharks/profiles";
import type { SharkEvaluation, Verdict } from "@/lib/store";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

async function evaluateWithShark(
  sharkId: string,
  sharkPersonality: string,
  sharkName: string,
  pitchText: string,
  fundingAsk: number
): Promise<SharkEvaluation> {
  // If no API key, generate a mock evaluation
  if (!process.env.OPENAI_API_KEY) {
    return mockEvaluation(sharkId, fundingAsk);
  }

  const prompt = `${sharkPersonality}

You are evaluating a startup pitch. Respond in JSON only, no other text.

Pitch:
${pitchText}

Funding ask: $${fundingAsk.toLocaleString()}

Respond with this exact JSON structure:
{
  "score": <number 1-10>,
  "analysis": "<2-3 sentence analysis>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "decision": "<fund|pass|conditional>",
  "fundingOffer": <number or null — amount you'd invest if you decide to fund>
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return {
      sharkId,
      score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
      analysis: parsed.analysis || "No analysis provided.",
      strengths: parsed.strengths || [],
      concerns: parsed.concerns || [],
      decision: parsed.decision || "pass",
      fundingOffer: parsed.fundingOffer || undefined,
    };
  } catch {
    return mockEvaluation(sharkId, fundingAsk);
  }
}

function mockEvaluation(sharkId: string, fundingAsk: number): SharkEvaluation {
  const score = Math.floor(Math.random() * 5) + 4; // 4-8
  const decisions: Array<"fund" | "pass" | "conditional"> = ["fund", "pass", "conditional"];
  const decision = decisions[Math.floor(Math.random() * 3)];
  return {
    sharkId,
    score,
    analysis: `[Demo mode — set OPENAI_API_KEY for real AI evaluations] This pitch shows potential with a score of ${score}/10.`,
    strengths: ["Interesting concept", "Good market timing"],
    concerns: ["Needs more validation", "Competitive landscape"],
    decision,
    fundingOffer: decision === "fund" ? Math.round(fundingAsk * 0.6) : undefined,
  };
}

// POST /api/evaluate — run all 5 sharks on a pitch
export async function POST(req: NextRequest) {
  const { pitchId } = await req.json();

  if (!pitchId) {
    return NextResponse.json({ error: "pitchId is required" }, { status: 400 });
  }

  const pitch = db.getPitch(pitchId);
  if (!pitch) {
    return NextResponse.json({ error: "Pitch not found" }, { status: 404 });
  }

  if (pitch.status !== "pending") {
    return NextResponse.json(
      { error: "Pitch has already been evaluated" },
      { status: 400 }
    );
  }

  // Update status to evaluating
  db.updatePitch(pitchId, { status: "evaluating" });

  const pitchText = `
Startup: ${pitch.name}
Tagline: ${pitch.tagline}
Industry: ${pitch.industry}
Stage: ${pitch.stage}

Description:
${pitch.description}
`.trim();

  // Run all sharks in parallel
  const evaluations = await Promise.all(
    SHARKS.map((shark) =>
      evaluateWithShark(
        shark.id,
        shark.personality,
        shark.name,
        pitchText,
        pitch.fundingAsk
      )
    )
  );

  // Calculate verdict
  const avgScore =
    evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
  const fundVotes = evaluations.filter((e) => e.decision === "fund").length;
  const approved = avgScore >= 6 && fundVotes >= 2; // Need avg 6+ and at least 2 sharks willing to fund

  const totalOffers = evaluations.reduce(
    (sum, e) => sum + (e.fundingOffer || 0),
    0
  );

  const verdict: Verdict = {
    approved,
    averageScore: avgScore,
    fundingApproved: approved ? totalOffers || pitch.fundingAsk : 0,
    summary: approved
      ? `${fundVotes} of 5 sharks are willing to fund. Average confidence: ${avgScore.toFixed(1)}/10. Total shark offers: $${totalOffers.toLocaleString()}.`
      : `Only ${fundVotes} of 5 sharks are willing to fund (need at least 2) with average score ${avgScore.toFixed(1)}/10 (need at least 6.0). The sharks recommend more work before launch.`,
  };

  const updated = db.updatePitch(pitchId, {
    status: "evaluated",
    evaluations,
    verdict,
  });

  return NextResponse.json({ pitch: updated });
}
