/**
 * JSON Array Utilities
 * 
 * Helper functions for encoding/decoding arrays in SQLite-compatible format.
 * SQLite doesn't support String[] arrays, so we store them as JSON strings.
 * 
 * Usage:
 * ```typescript
 * // Encoding (when saving to database)
 * const encoded = encodeStringArray(['AI', 'Web3', 'FinTech']);
 * await prisma.vC.create({
 *   data: {
 *     focusAreas: encoded,
 *   }
 * });
 * 
 * // Decoding (when reading from database)
 * const vc = await prisma.vC.findUnique({ where: { id: '...' } });
 * const areas = decodeStringArray(vc.focusAreas); // ['AI', 'Web3', 'FinTech']
 * ```
 */

/**
 * Encode a string array as JSON for storage in SQLite
 */
export function encodeStringArray(arr: string[]): string {
  return JSON.stringify(arr);
}

/**
 * Decode a JSON string back to a string array
 * Returns empty array if input is null/empty or invalid JSON
 */
export function decodeStringArray(str: string | null | undefined): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Encode an object array as JSON for storage in SQLite
 */
export function encodeJsonArray<T>(arr: T[]): string {
  return JSON.stringify(arr);
}

/**
 * Decode a JSON string back to an object array
 * Returns empty array if input is null/empty or invalid JSON
 */
export function decodeJsonArray<T>(str: string | null | undefined): T[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Type-safe helper for encoding enum arrays (like FundingType[])
 */
export function encodeEnumArray<T extends string>(arr: T[]): string {
  return JSON.stringify(arr);
}

/**
 * Type-safe helper for decoding enum arrays
 */
export function decodeEnumArray<T extends string>(str: string | null | undefined): T[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
