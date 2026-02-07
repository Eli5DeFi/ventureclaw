/**
 * Semantic Memory System
 * 
 * Multi-level memory for AI agents:
 * - User level: Remember user preferences, history
 * - Session level: Context within conversation
 * - Agent level: Agent-specific learnings
 * - Global level: Cross-entity patterns
 * 
 * Features:
 * - Semantic search via embeddings
 * - Relevance ranking
 * - Access tracking
 * - Memory decay (older memories fade)
 * - Memory consolidation (similar memories merge)
 * 
 * Usage:
 * ```typescript
 * const memory = new SemanticMemory();
 * 
 * // Store evaluation result
 * await memory.store({
 *   content: "B2B SaaS with $500K ARR and 40% MoM growth was funded",
 *   memoryType: "evaluation",
 *   entityId: startupId,
 *   metadata: { score: 85, recommendation: "APPROVED" }
 * });
 * 
 * // Search relevant memories
 * const relevant = await memory.search("B2B SaaS with high growth", { limit: 5 });
 * ```
 */

import { prisma } from '../prisma';
import {
  generateEmbedding,
  parseEmbedding,
  serializeEmbedding,
  findTopSimilar,
  compressForEmbedding,
} from './embeddings';

export interface MemoryInput {
  content: string;
  memoryType?: string; // evaluation, pattern, insight, lesson
  entityId?: string;
  entityType?: string; // startup, analysis, agent, decision
  userId?: string;
  startupId?: string;
  metadata?: Record<string, any>;
  relevanceScore?: number;
}

export interface MemorySearchOptions {
  limit?: number;
  memoryType?: string;
  entityType?: string;
  userId?: string;
  startupId?: string;
  minScore?: number;
  timeWindow?: number; // days (e.g., only search last 30 days)
}

export interface MemoryResult {
  id: string;
  content: string;
  score: number;
  memoryType: string;
  entityId: string | null;
  entityType: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export class SemanticMemory {
  /**
   * Store a new memory with semantic embedding
   */
  async store(input: MemoryInput): Promise<string> {
    try {
      // Compress content if needed (reduce tokens)
      const compressed = compressForEmbedding(input.content, 6000);

      // Generate embedding
      const embedding = await generateEmbedding(compressed);

      // Store in database
      const memory = await prisma.memory.create({
        data: {
          content: input.content,
          embedding: serializeEmbedding(embedding.vector),
          memoryType: input.memoryType || 'evaluation',
          entityId: input.entityId,
          entityType: input.entityType,
          userId: input.userId,
          startupId: input.startupId,
          metadata: input.metadata as any,
          relevanceScore: input.relevanceScore || 1.0,
        },
      });

      console.log(`[Memory] Stored memory ${memory.id} (type: ${memory.memoryType})`);
      return memory.id;
    } catch (error) {
      console.error('[Memory] Error storing memory:', error);
      throw error;
    }
  }

  /**
   * Batch store multiple memories (more efficient)
   */
  async storeBatch(inputs: MemoryInput[]): Promise<string[]> {
    try {
      // Generate all embeddings at once
      const compressed = inputs.map((input) => compressForEmbedding(input.content, 6000));
      const embeddings = await Promise.all(compressed.map((text) => generateEmbedding(text)));

      // Batch insert
      const memories = await prisma.$transaction(
        inputs.map((input, idx) =>
          prisma.memory.create({
            data: {
              content: input.content,
              embedding: serializeEmbedding(embeddings[idx].vector),
              memoryType: input.memoryType || 'evaluation',
              entityId: input.entityId,
              entityType: input.entityType,
              userId: input.userId,
              startupId: input.startupId,
              metadata: input.metadata as any,
              relevanceScore: input.relevanceScore || 1.0,
            },
          })
        )
      );

      console.log(`[Memory] Batch stored ${memories.length} memories`);
      return memories.map((m) => m.id);
    } catch (error) {
      console.error('[Memory] Error batch storing memories:', error);
      throw error;
    }
  }

  /**
   * Semantic search for relevant memories
   */
  async search(query: string, options: MemorySearchOptions = {}): Promise<MemoryResult[]> {
    try {
      const {
        limit = 5,
        memoryType,
        entityType,
        userId,
        startupId,
        minScore = 0.7,
        timeWindow,
      } = options;

      // Generate query embedding
      const queryEmbedding = await generateEmbedding(query);

      // Build filters
      const where: any = {};
      if (memoryType) where.memoryType = memoryType;
      if (entityType) where.entityType = entityType;
      if (userId) where.userId = userId;
      if (startupId) where.startupId = startupId;

      // Time window filter
      if (timeWindow) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - timeWindow);
        where.createdAt = { gte: cutoff };
      }

      // Fetch candidate memories (all with embeddings)
      const candidates = await prisma.memory.findMany({
        where: {
          ...where,
          embedding: { not: null },
        },
        select: {
          id: true,
          content: true,
          embedding: true,
          memoryType: true,
          entityId: true,
          entityType: true,
          metadata: true,
          createdAt: true,
          accessCount: true,
          relevanceScore: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit candidate pool for performance
      });

      if (candidates.length === 0) {
        console.log('[Memory] No candidates found for search');
        return [];
      }

      // Parse embeddings
      const candidateVectors = candidates.map((c) => ({
        id: c.id,
        vector: parseEmbedding(c.embedding!),
        data: c,
      }));

      // Find top similar
      const topSimilar = findTopSimilar(
        queryEmbedding.vector,
        candidateVectors.map((c) => ({ id: c.id, vector: c.vector })),
        limit * 2 // Get more to filter by minScore
      );

      // Filter by minScore and apply decay
      const now = Date.now();
      const results = topSimilar
        .map((match) => {
          const candidate = candidateVectors.find((c) => c.id === match.id)!;

          // Time decay (older memories fade)
          const ageInDays = (now - candidate.data.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const decayFactor = Math.exp(-ageInDays / 180); // Half-life: 180 days

          // Access boost (frequently accessed memories rank higher)
          const accessBoost = Math.log(candidate.data.accessCount + 1) * 0.05;

          // Relevance score boost
          const relevanceBoost = (candidate.data.relevanceScore || 1.0) * 0.1;

          // Final score
          const finalScore =
            match.score * (1 + decayFactor * 0.2 + accessBoost + relevanceBoost);

          return {
            id: candidate.id,
            content: candidate.data.content,
            score: finalScore,
            memoryType: candidate.data.memoryType,
            entityId: candidate.data.entityId,
            entityType: candidate.data.entityType,
            metadata: candidate.data.metadata as Record<string, any> | null,
            createdAt: candidate.data.createdAt,
          };
        })
        .filter((r) => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Track search
      await this.trackSearch(query, queryEmbedding.vector, results);

      // Update access counts
      if (results.length > 0) {
        await prisma.memory.updateMany({
          where: {
            id: { in: results.map((r) => r.id) },
          },
          data: {
            accessCount: { increment: 1 },
            lastAccessedAt: new Date(),
          },
        });
      }

      console.log(`[Memory] Search "${query}" returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error('[Memory] Error searching memories:', error);
      return [];
    }
  }

  /**
   * Get memory by ID
   */
  async get(id: string): Promise<MemoryResult | null> {
    try {
      const memory = await prisma.memory.findUnique({
        where: { id },
        select: {
          id: true,
          content: true,
          memoryType: true,
          entityId: true,
          entityType: true,
          metadata: true,
          createdAt: true,
        },
      });

      if (!memory) {
        return null;
      }

      // Update access
      await prisma.memory.update({
        where: { id },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });

      return {
        ...memory,
        score: 1.0,
        metadata: memory.metadata as Record<string, any> | null,
      };
    } catch (error) {
      console.error('[Memory] Error getting memory:', error);
      return null;
    }
  }

  /**
   * Delete old memories (cleanup)
   */
  async cleanup(olderThanDays: number = 365): Promise<number> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - olderThanDays);

      const result = await prisma.memory.deleteMany({
        where: {
          createdAt: { lt: cutoff },
          accessCount: { lt: 5 }, // Only delete rarely accessed
        },
      });

      console.log(`[Memory] Cleaned up ${result.count} old memories`);
      return result.count;
    } catch (error) {
      console.error('[Memory] Error cleaning up memories:', error);
      return 0;
    }
  }

  /**
   * Get memory statistics
   */
  async stats(): Promise<{
    total: number;
    byType: Record<string, number>;
    avgAccessCount: number;
    recentSearches: number;
  }> {
    try {
      const [total, byType, avgAccess, recentSearches] = await Promise.all([
        prisma.memory.count(),
        prisma.memory.groupBy({
          by: ['memoryType'],
          _count: true,
        }),
        prisma.memory.aggregate({
          _avg: { accessCount: true },
        }),
        prisma.memorySearch.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
            },
          },
        }),
      ]);

      return {
        total,
        byType: byType.reduce(
          (acc, item) => {
            acc[item.memoryType] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        avgAccessCount: avgAccess._avg.accessCount || 0,
        recentSearches,
      };
    } catch (error) {
      console.error('[Memory] Error getting stats:', error);
      return {
        total: 0,
        byType: {},
        avgAccessCount: 0,
        recentSearches: 0,
      };
    }
  }

  /**
   * Track search query (for analytics)
   */
  private async trackSearch(
    query: string,
    queryVector: number[],
    results: MemoryResult[]
  ): Promise<void> {
    try {
      await prisma.memorySearch.create({
        data: {
          query,
          queryEmbedding: serializeEmbedding(queryVector),
          resultCount: results.length,
          topResultIds: results.map((r) => r.id),
          averageScore: results.length > 0
            ? results.reduce((sum, r) => sum + r.score, 0) / results.length
            : 0,
        },
      });
    } catch (error) {
      // Non-critical, log but don't throw
      console.error('[Memory] Error tracking search:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const semanticMemory = new SemanticMemory();

/**
 * Helper: Store evaluation result as memory
 */
export async function storeEvaluationMemory(
  startupId: string,
  analysis: {
    overallScore: number;
    recommendation: string;
    summary: string;
    keyStrengths: string[];
    keyConcerns: string[];
  }
): Promise<void> {
  const content = `
Evaluation for startup ${startupId}:
Score: ${analysis.overallScore}/100
Recommendation: ${analysis.recommendation}
Summary: ${analysis.summary}
Strengths: ${analysis.keyStrengths.join(', ')}
Concerns: ${analysis.keyConcerns.join(', ')}
  `.trim();

  await semanticMemory.store({
    content,
    memoryType: 'evaluation',
    entityId: startupId,
    entityType: 'startup',
    startupId,
    metadata: {
      score: analysis.overallScore,
      recommendation: analysis.recommendation,
    },
    relevanceScore: analysis.overallScore / 100,
  });
}

/**
 * Helper: Search for similar evaluations
 */
export async function searchSimilarEvaluations(
  query: string,
  limit: number = 5
): Promise<MemoryResult[]> {
  return semanticMemory.search(query, {
    limit,
    memoryType: 'evaluation',
    entityType: 'startup',
    minScore: 0.75,
  });
}
