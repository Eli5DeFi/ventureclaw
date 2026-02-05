import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Pitch } from "@/lib/store";

// GET /api/pitch — list all pitches, or get one by ?id=
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const pitch = db.getPitch(id);
    if (!pitch) {
      return NextResponse.json({ error: "Pitch not found" }, { status: 404 });
    }
    return NextResponse.json({ pitch });
  }

  return NextResponse.json({ pitches: db.getAllPitches() });
}

// POST /api/pitch — create a new pitch
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, tagline, description, industry, stage, fundingAsk, founderEmail } = body;

  if (!name || !tagline || !description || !industry || !stage || !fundingAsk || !founderEmail) {
    return NextResponse.json(
      { error: "All fields are required: name, tagline, description, industry, stage, fundingAsk, founderEmail" },
      { status: 400 }
    );
  }

  const pitch: Pitch = {
    id: crypto.randomUUID(),
    name,
    tagline,
    description,
    industry,
    stage,
    fundingAsk: Number(fundingAsk),
    founderEmail,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  db.createPitch(pitch);
  return NextResponse.json({ id: pitch.id, pitch }, { status: 201 });
}
