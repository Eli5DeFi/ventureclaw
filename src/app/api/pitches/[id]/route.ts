import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const startup = await prisma.startup.findUnique({
      where: { id },
      include: {
        analysis: true,
        vcMatches: {
          include: {
            vc: true,
          },
        },
        agentActivities: {
          orderBy: {
            startedAt: "desc",
          },
          take: 20,
        },
      },
    });
    
    if (!startup) {
      return NextResponse.json(
        {
          success: false,
          error: "Startup not found",
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: startup,
    });
    
  } catch (error) {
    logger.error("Error fetching pitch:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pitch",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Only allow updating certain fields
    const allowedUpdates = [
      "name",
      "tagline",
      "description",
      "website",
      "deckUrl",
      "pitchVideo",
    ];
    
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    
    const startup = await prisma.startup.update({
      where: { id },
      data: updates,
      include: {
        analysis: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: startup,
    });
    
  } catch (error) {
    logger.error("Error updating pitch:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update pitch",
      },
      { status: 500 }
    );
  }
}
