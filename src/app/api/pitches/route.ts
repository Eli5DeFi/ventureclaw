import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { analyzeStartupOptimized as analyzeStartup } from "@/lib/agents/orchestrator-optimized";
import { performSecurityCheck, logSecurityEvent } from "@/lib/security/anti-sybil";
import { rateLimit } from "@/lib/rate-limit";
import { withCache } from "@/lib/cache";
import { withPerformanceMonitoring } from "@/lib/monitoring/performance";
import { logger } from "@/lib/logger";

// Validation schema
const CreatePitchSchema = z.object({
  name: z.string().min(1).max(100),
  tagline: z.string().min(1).max(200),
  description: z.string().min(50).max(2000),
  stage: z.enum(["IDEA", "MVP", "GROWTH", "SCALE"]),
  industry: z.string().min(1),
  fundingAsk: z.number().min(10000).max(100000000),
  teamSize: z.number().min(1).max(1000),
  founderName: z.string().min(1),
  founderEmail: z.string().email(),
  website: z.string().url().optional().nullable(),
  deckUrl: z.string().url().optional().nullable(),
  pitchVideo: z.string().url().optional().nullable(),
});

async function handlePOST(request: NextRequest) {
  // Rate limiting - prevent spam/abuse
  const rateLimitResponse = rateLimit(request, 5); // 5 pitches per minute max
  if (rateLimitResponse) return rateLimitResponse;
  
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = CreatePitchSchema.parse(body);
    
    // Security check (anti-sybil, anti-spam)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;
    
    const securityCheck = await performSecurityCheck({
      name: validatedData.name,
      tagline: validatedData.tagline,
      description: validatedData.description,
      founderEmail: validatedData.founderEmail,
      ip,
      userAgent,
    });
    
    if (!securityCheck.passed) {
      // Log security event
      await logSecurityEvent({
        type: securityCheck.severity === "high" ? "spam" : "suspicious",
        email: validatedData.founderEmail,
        ip,
        details: securityCheck.issues.join("; "),
      });
      
      return NextResponse.json(
        {
          success: false,
          error: "Security check failed",
          issues: securityCheck.issues,
        },
        { status: 400 }
      );
    }
    
    // Create startup in database
    const startup = await prisma.startup.create({
      data: {
        ...validatedData,
        status: "PENDING",
      },
    });
    
    // Trigger analysis asynchronously (don't wait for it)
    analyzeStartup(startup.id)
      .then(() => {
        logger.log(`Analysis completed for startup: ${startup.id}`);
      })
      .catch((error) => {
        logger.error(`Analysis failed for startup: ${startup.id}`, error);
        // TODO: In production, send to error tracking service (e.g., Sentry)
      });
    
    return NextResponse.json(
      {
        success: true,
        startupId: startup.id,
        message: "Pitch submitted successfully. Analysis in progress...",
      },
      { status: 201 }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    logger.error("Error creating pitch:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit pitch. Please try again.",
      },
      { status: 500 }
    );
  }
}

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Cache key includes query params for proper cache segmentation
    const cacheKey = `pitches-list-${status || "all"}-${limit}-${offset}`;
    
    // Cache for 2 minutes (balances freshness vs performance)
    const result = await withCache(
      cacheKey,
      async () => {
        const where = status ? { status: status as any } : {};
        
        const [startups, total] = await Promise.all([
          prisma.startup.findMany({
            where,
            include: {
              analysis: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: limit,
            skip: offset,
          }),
          prisma.startup.count({ where }),
        ]);
        
        return {
          success: true,
          data: startups,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      },
      2 * 60 * 1000 // 2 minutes TTL
    );
    
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error("Error fetching pitches:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pitches",
      },
      { status: 500 }
    );
  }
}

// Export handlers with performance monitoring
export async function POST(request: NextRequest) {
  return withPerformanceMonitoring('/api/pitches', 'POST', () => handlePOST(request));
}

export async function GET(request: NextRequest) {
  return withPerformanceMonitoring('/api/pitches', 'GET', () => handleGET(request));
}
