// Authentication configuration using NextAuth.js v5 (Auth.js)
// Supports: Email magic links, Google OAuth, GitHub OAuth, Email/Password

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Resend from 'next-auth/providers/resend';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers: [
    // Email/Password login
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    
    // Email magic links (passwordless)
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: 'Swarm Accelerator <auth@swarm.accelerator.ai>',
    }),
    
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Auto-link if email matches
    }),
    
    // GitHub OAuth
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify',
    error: '/auth/error',
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        
        // Fetch additional user data
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { tier: true, apiKey: true, walletAddress: true },
        });
        
        token.tier = dbUser?.tier || 'free';
        token.apiKey = dbUser?.apiKey || null;
        token.walletAddress = dbUser?.walletAddress || null;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Add user data to session from JWT token
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tier = token.tier as string;
        session.user.apiKey = token.apiKey as string | null;
        session.user.walletAddress = token.walletAddress as string | null;
      }
      
      return session;
    },
    
    async signIn({ user, account, profile }) {
      // Auto-create API key on first sign-in
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        
        if (!existingUser?.apiKey) {
          // Generate API key
          const apiKey = generateApiKey('free');
          
          await prisma.user.update({
            where: { email: user.email },
            data: { apiKey },
          });
        }
      }
      
      return true;
    },
  },
  
  session: {
    strategy: 'jwt', // JWT required for Credentials provider
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  debug: process.env.NODE_ENV === 'development',
});

// Generate API key
function generateApiKey(tier: 'free' | 'agent' | 'enterprise'): string {
  const prefix = tier === 'free' ? 'sk_free_' : 
                 tier === 'agent' ? 'sk_agent_' : 
                 'sk_enterprise_';
  
  const randomPart = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
  
  return prefix + randomPart;
}

// Middleware helper to protect routes
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error('Unauthorized - please sign in');
  }
  
  return session;
}

// Check if user has required tier
export async function requireTier(minTier: 'free' | 'startup' | 'enterprise') {
  const session = await requireAuth();
  
  const tierLevel = {
    free: 0,
    startup: 1,
    enterprise: 2,
  };
  
  const userTierLevel = tierLevel[session.user.tier as keyof typeof tierLevel] || 0;
  const requiredTierLevel = tierLevel[minTier];
  
  if (userTierLevel < requiredTierLevel) {
    throw new Error(`This feature requires ${minTier} tier or higher`);
  }
  
  return session;
}
