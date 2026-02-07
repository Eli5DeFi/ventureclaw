/**
 * Embedding Generation for Semantic Memory
 * 
 * Uses OpenAI's text-embedding-3-small model:
 * - 1536 dimensions
 * - $0.02 per 1M tokens (very cheap)
 * - Fast and accurate
 * 
 * Cosine similarity for search.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Embedding {
  vector: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate embedding vector for text
 */
export async function generateEmbedding(text: string): Promise<Embedding> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit to ~8K tokens
    });

    return {
      vector: response.data[0].embedding,
      model: 'text-embedding-3-small',
      usage: {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error);
    throw error;
  }
}

/**
 * Batch generate embeddings (more efficient)
 */
export async function generateEmbeddings(texts: string[]): Promise<Embedding[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map((t) => t.slice(0, 8000)),
    });

    return response.data.map((item, idx) => ({
      vector: item.embedding,
      model: 'text-embedding-3-small',
      usage: {
        promptTokens: Math.floor(response.usage.prompt_tokens / texts.length),
        totalTokens: Math.floor(response.usage.total_tokens / texts.length),
      },
    }));
  } catch (error) {
    console.error('[Embeddings] Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}

/**
 * Find top-K most similar vectors
 */
export function findTopSimilar(
  queryVector: number[],
  candidateVectors: Array<{ id: string; vector: number[] }>,
  topK: number = 5
): Array<{ id: string; score: number }> {
  const scores = candidateVectors.map((candidate) => ({
    id: candidate.id,
    score: cosineSimilarity(queryVector, candidate.vector),
  }));

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, topK);
}

/**
 * Compress text for embedding (reduce tokens)
 * 
 * Keeps key information while reducing size:
 * - Extract main concepts
 * - Remove filler words
 * - Keep numerical data
 */
export function compressForEmbedding(text: string, maxLength: number = 8000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Prioritize sentences with key terms
  const keyTerms = [
    'revenue',
    'growth',
    'market',
    'product',
    'team',
    'traction',
    'customer',
    'metric',
    'score',
    'risk',
    'opportunity',
    'competitive',
    'valuation',
    'milestone',
    'founder',
    'technology',
    'patent',
    'regulatory',
  ];

  const scored = sentences.map((sentence) => {
    const lower = sentence.toLowerCase();
    const score = keyTerms.reduce((sum, term) => {
      return sum + (lower.includes(term) ? 1 : 0);
    }, 0);
    return { sentence, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Take top sentences up to maxLength
  let compressed = '';
  for (const { sentence } of scored) {
    if (compressed.length + sentence.length > maxLength) {
      break;
    }
    compressed += sentence + '. ';
  }

  return compressed.trim();
}

/**
 * Parse embedding from JSON string
 */
export function parseEmbedding(embeddingJson: string): number[] {
  try {
    return JSON.parse(embeddingJson);
  } catch (error) {
    console.error('[Embeddings] Error parsing embedding:', error);
    return [];
  }
}

/**
 * Serialize embedding to JSON string
 */
export function serializeEmbedding(vector: number[]): string {
  return JSON.stringify(vector);
}
