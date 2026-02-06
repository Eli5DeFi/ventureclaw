import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";

const WaitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["founder", "vc", "other"]).optional(),
  referredBy: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = WaitlistSchema.parse(body);
    
    // Check if already exists
    const existing = await prisma.waitlistEntry.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existing) {
      return NextResponse.json(
        {
          success: true,
          message: "You're already on the waitlist!",
          alreadyExists: true,
        },
        { status: 200 }
      );
    }
    
    // Create waitlist entry
    await prisma.waitlistEntry.create({
      data: validatedData,
    });
    
    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the waitlist!",
      },
      { status: 201 }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email address",
        },
        { status: 400 }
      );
    }
    
    logger.error("Error adding to waitlist:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to join waitlist",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Only for admin - in production, add auth check
    const count = await prisma.waitlistEntry.count();
    
    return NextResponse.json({
      success: true,
      count,
    });
    
  } catch (error) {
    logger.error("Error fetching waitlist count:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch waitlist count",
      },
      { status: 500 }
    );
  }
}
