import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const startupId = searchParams.get("startupId");
    
    const where = startupId ? { startupId } : {};
    
    const activities = await prisma.agentActivity.findMany({
      where,
      include: {
        startup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      take: limit,
    });
    
    return NextResponse.json({
      success: true,
      data: activities,
    });
    
  } catch (error) {
    logger.error("Error fetching agent activity:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agent activity",
      },
      { status: 500 }
    );
  }
}
