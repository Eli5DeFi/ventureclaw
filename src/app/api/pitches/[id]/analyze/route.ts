import { NextRequest, NextResponse } from "next/server";
import { analyzeStartupOptimized as analyzeStartup } from "@/lib/agents/orchestrator-optimized";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if startup exists
    const startup = await prisma.startup.findUnique({
      where: { id },
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
    
    // Check if already analyzing
    if (startup.status === "ANALYZING") {
      return NextResponse.json(
        {
          success: false,
          error: "Analysis already in progress",
        },
        { status: 409 }
      );
    }
    
    // Trigger analysis
    const analysis = await analyzeStartup(id);
    
    return NextResponse.json({
      success: true,
      data: analysis,
      message: "Analysis completed successfully",
    });
    
  } catch (error) {
    logger.error("Error analyzing startup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
