/**
 * Signup API route for creating new user accounts with email/password
 * 
 * @route POST /api/auth/signup
 * @body { email: string, password: string, name?: string }
 * @returns { message: string, user: User } - Created user data (excludes password)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema with proper email format and password requirements
const SignupSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validationResult = SignupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate API key
    const apiKey = `sk_free_${nanoid(32)}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        tier: 'free',
        apiKey,
        emailVerified: new Date(), // Auto-verify for password signups
      },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user,
        apiKey, // Return API key for immediate use
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Signup error:', error);
    
    // Check for database-specific errors
    if (error instanceof Error) {
      // Handle Prisma unique constraint violation
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
