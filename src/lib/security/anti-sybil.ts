import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Anti-Sybil and Security Measures
 * 
 * Prevents:
 * - Multiple submissions from same user
 * - Bot/spam submissions
 * - Gaming the system
 * - Fake reviews/ratings
 */

// Fingerprint generation
export function generateFingerprint(data: {
  email: string;
  ip?: string;
  userAgent?: string;
}): string {
  const normalized = {
    email: data.email.toLowerCase().trim(),
    ip: data.ip || "",
    userAgent: data.userAgent || "",
  };
  
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
}

// Check if startup is duplicate/similar
export async function checkDuplicateStartup(startup: {
  name: string;
  description: string;
  founderEmail: string;
}): Promise<{
  isDuplicate: boolean;
  reason?: string;
  similarStartupId?: string;
}> {
  // Check exact name match
  const exactMatch = await prisma.startup.findFirst({
    where: {
      name: {
        equals: startup.name,
        mode: "insensitive",
      },
    },
  });
  
  if (exactMatch) {
    return {
      isDuplicate: true,
      reason: "Startup with same name already exists",
      similarStartupId: exactMatch.id,
    };
  }
  
  // Check same founder + similar name
  const sameFounder = await prisma.startup.findFirst({
    where: {
      founderEmail: {
        equals: startup.founderEmail,
        mode: "insensitive",
      },
      name: {
        contains: startup.name.split(" ")[0], // First word match
        mode: "insensitive",
      },
    },
  });
  
  if (sameFounder) {
    return {
      isDuplicate: true,
      reason: "Similar startup from same founder already submitted",
      similarStartupId: sameFounder.id,
    };
  }
  
  return { isDuplicate: false };
}

// Rate limiting per email
export async function checkRateLimit(email: string): Promise<{
  allowed: boolean;
  reason?: string;
  waitTime?: number;
}> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Count submissions in last 24 hours
  const recentCount = await prisma.startup.count({
    where: {
      founderEmail: {
        equals: email,
        mode: "insensitive",
      },
      createdAt: {
        gte: oneDayAgo,
      },
    },
  });
  
  // Limit: 3 submissions per day
  if (recentCount >= 3) {
    return {
      allowed: false,
      reason: "Maximum 3 submissions per day reached",
      waitTime: 24 * 60 * 60, // seconds
    };
  }
  
  // Count submissions in last week
  const weeklyCount = await prisma.startup.count({
    where: {
      founderEmail: {
        equals: email,
        mode: "insensitive",
      },
      createdAt: {
        gte: oneWeekAgo,
      },
    },
  });
  
  // Limit: 10 submissions per week
  if (weeklyCount >= 10) {
    return {
      allowed: false,
      reason: "Maximum 10 submissions per week reached",
      waitTime: 7 * 24 * 60 * 60, // seconds
    };
  }
  
  return { allowed: true };
}

// Content quality check (detect spam/gibberish)
export function checkContentQuality(content: {
  name: string;
  tagline: string;
  description: string;
}): {
  isValid: boolean;
  reason?: string;
  score: number;
} {
  let score = 100;
  const reasons: string[] = [];
  
  // Check minimum lengths
  if (content.description.length < 50) {
    score -= 30;
    reasons.push("Description too short");
  }
  
  if (content.tagline.length < 10) {
    score -= 20;
    reasons.push("Tagline too short");
  }
  
  // Check for repeated characters (spam pattern)
  const repeatedChar = /(.)\1{5,}/;
  if (repeatedChar.test(content.description)) {
    score -= 40;
    reasons.push("Suspicious repeated characters");
  }
  
  // Check for all caps (spam pattern)
  const allCapsWords = content.description.split(" ").filter(word => 
    word.length > 3 && word === word.toUpperCase()
  );
  if (allCapsWords.length > 5) {
    score -= 30;
    reasons.push("Too many all-caps words");
  }
  
  // Check for excessive special characters
  const specialChars = content.description.match(/[^a-zA-Z0-9\s]/g);
  if (specialChars && specialChars.length > content.description.length * 0.1) {
    score -= 20;
    reasons.push("Excessive special characters");
  }
  
  // Check for common spam keywords
  const spamKeywords = ["viagra", "casino", "lottery", "click here", "buy now"];
  const lowerDescription = content.description.toLowerCase();
  const spamFound = spamKeywords.filter(keyword => 
    lowerDescription.includes(keyword)
  );
  if (spamFound.length > 0) {
    score -= 50;
    reasons.push(`Spam keywords detected: ${spamFound.join(", ")}`);
  }
  
  // Check for real words vs gibberish
  const words = content.description.split(/\s+/);
  const longWeirdWords = words.filter(word => 
    word.length > 15 && !/[aeiou]/i.test(word)
  );
  if (longWeirdWords.length > 3) {
    score -= 25;
    reasons.push("Suspicious word patterns");
  }
  
  return {
    isValid: score >= 60,
    reason: reasons.join("; "),
    score,
  };
}

// Email domain validation
export function validateEmailDomain(email: string): {
  isValid: boolean;
  reason?: string;
} {
  const disposableEmailDomains = [
    "tempmail.com",
    "throwaway.email",
    "guerrillamail.com",
    "mailinator.com",
    "10minutemail.com",
    "trashmail.com",
  ];
  
  const domain = email.split("@")[1]?.toLowerCase();
  
  if (!domain) {
    return {
      isValid: false,
      reason: "Invalid email format",
    };
  }
  
  if (disposableEmailDomains.includes(domain)) {
    return {
      isValid: false,
      reason: "Disposable email addresses not allowed",
    };
  }
  
  return { isValid: true };
}

// Comprehensive security check
export async function performSecurityCheck(data: {
  name: string;
  tagline: string;
  description: string;
  founderEmail: string;
  ip?: string;
  userAgent?: string;
}): Promise<{
  passed: boolean;
  issues: string[];
  severity: "low" | "medium" | "high";
}> {
  const issues: string[] = [];
  let severity: "low" | "medium" | "high" = "low";
  
  // 1. Check rate limit
  const rateLimit = await checkRateLimit(data.founderEmail);
  if (!rateLimit.allowed) {
    issues.push(rateLimit.reason || "Rate limit exceeded");
    severity = "high";
  }
  
  // 2. Check for duplicates
  const duplicate = await checkDuplicateStartup({
    name: data.name,
    description: data.description,
    founderEmail: data.founderEmail,
  });
  if (duplicate.isDuplicate) {
    issues.push(duplicate.reason || "Duplicate submission");
    severity = "medium";
  }
  
  // 3. Check content quality
  const quality = checkContentQuality({
    name: data.name,
    tagline: data.tagline,
    description: data.description,
  });
  if (!quality.isValid) {
    issues.push(`Content quality issues: ${quality.reason}`);
    if (quality.score < 40) {
      severity = "high";
    } else if (severity === "low") {
      severity = "medium";
    }
  }
  
  // 4. Check email domain
  const emailCheck = validateEmailDomain(data.founderEmail);
  if (!emailCheck.isValid) {
    issues.push(emailCheck.reason || "Invalid email");
    severity = "high";
  }
  
  return {
    passed: issues.length === 0,
    issues,
    severity,
  };
}

// Log security events
export async function logSecurityEvent(event: {
  type: "rate_limit" | "duplicate" | "spam" | "suspicious";
  email: string;
  ip?: string;
  details: string;
}) {
  // In production, send to security monitoring system (Sentry, custom service)
  console.warn("[SECURITY]", event);
  
  // Could also write to database for analysis
  // await prisma.securityEvent.create({ data: event });
}
