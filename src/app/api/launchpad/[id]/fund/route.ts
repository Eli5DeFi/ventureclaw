import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Backer } from "@/lib/store";

// POST /api/launchpad/[id]/fund — fund a launchpad project (futarchy vote)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, type, amount, vote } = body;

  if (!amount || !vote) {
    return NextResponse.json(
      { error: "amount and vote (yes/no) are required" },
      { status: 400 }
    );
  }

  if (vote !== "yes" && vote !== "no") {
    return NextResponse.json(
      { error: "vote must be 'yes' or 'no'" },
      { status: 400 }
    );
  }

  const project = db.getLaunchpadProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.status !== "active") {
    return NextResponse.json(
      { error: "This project is no longer accepting funding" },
      { status: 400 }
    );
  }

  const backer: Backer = {
    id: crypto.randomUUID(),
    name: name || (type === "ai-agent" ? "AI Agent" : "Anonymous"),
    type: type || "human",
    amount: Number(amount),
    vote,
    timestamp: new Date().toISOString(),
  };

  const newBackers = [...project.backers, backer];
  const newFundingRaised = project.fundingRaised + (vote === "yes" ? Number(amount) : 0);
  const newYesVotes = project.yesVotes + (vote === "yes" ? 1 : 0);
  const newNoVotes = project.noVotes + (vote === "no" ? 1 : 0);

  // Check if funded
  let newStatus: "active" | "funded" | "failed" = project.status;
  if (newFundingRaised >= project.fundingGoal) {
    newStatus = "funded";
  }

  // Futarchy check: if NO votes exceed YES by 2x, project fails
  if (newNoVotes > newYesVotes * 2 && newNoVotes >= 5) {
    newStatus = "failed";
  }

  const updated = db.updateLaunchpadProject(id, {
    backers: newBackers,
    fundingRaised: newFundingRaised,
    yesVotes: newYesVotes,
    noVotes: newNoVotes,
    status: newStatus,
  });

  return NextResponse.json({ project: updated });
}
