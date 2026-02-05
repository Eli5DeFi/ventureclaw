import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { LaunchpadProject } from "@/lib/store";

// GET /api/launchpad — list all projects, or get one by ?id=
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const project = db.getLaunchpadProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project });
  }

  return NextResponse.json({ projects: db.getAllLaunchpadProjects() });
}

// POST /api/launchpad — launch an approved pitch on the launchpad
export async function POST(req: NextRequest) {
  const { pitchId } = await req.json();

  if (!pitchId) {
    return NextResponse.json({ error: "pitchId is required" }, { status: 400 });
  }

  const pitch = db.getPitch(pitchId);
  if (!pitch) {
    return NextResponse.json({ error: "Pitch not found" }, { status: 404 });
  }

  if (!pitch.verdict?.approved) {
    return NextResponse.json(
      { error: "Pitch must be approved by the sharks before launching" },
      { status: 400 }
    );
  }

  if (pitch.status === "launched") {
    return NextResponse.json(
      { error: "Pitch is already launched" },
      { status: 400 }
    );
  }

  const now = new Date();
  const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const project: LaunchpadProject = {
    id: crypto.randomUUID(),
    pitchId: pitch.id,
    name: pitch.name,
    tagline: pitch.tagline,
    description: pitch.description,
    fundingGoal: pitch.verdict.fundingApproved || pitch.fundingAsk,
    fundingRaised: 0,
    yesVotes: 0,
    noVotes: 0,
    backers: [],
    status: "active",
    launchedAt: now.toISOString(),
    deadline: deadline.toISOString(),
  };

  db.createLaunchpadProject(project);
  db.updatePitch(pitchId, { status: "launched" });

  return NextResponse.json({ project }, { status: 201 });
}
