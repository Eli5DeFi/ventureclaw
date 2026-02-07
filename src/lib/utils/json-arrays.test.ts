import { describe, it, expect } from 'vitest';
import {
  encodeStringArray,
  decodeStringArray,
  encodeJsonArray,
  decodeJsonArray,
  encodeEnumArray,
  decodeEnumArray,
} from './json-arrays';

describe('JSON Array Utilities', () => {
  describe('encodeStringArray', () => {
    it('should encode array as JSON string', () => {
      const result = encodeStringArray(['AI', 'Web3', 'FinTech']);
      expect(result).toBe('["AI","Web3","FinTech"]');
    });

    it('should handle empty array', () => {
      expect(encodeStringArray([])).toBe('[]');
    });

    it('should handle special characters', () => {
      const result = encodeStringArray(['"quotes"', 'line\nbreak', 'tab\t']);
      expect(JSON.parse(result)).toEqual(['"quotes"', 'line\nbreak', 'tab\t']);
    });
  });

  describe('decodeStringArray', () => {
    it('should decode JSON string to array', () => {
      const result = decodeStringArray('["AI","Web3","FinTech"]');
      expect(result).toEqual(['AI', 'Web3', 'FinTech']);
    });

    it('should handle null input', () => {
      expect(decodeStringArray(null)).toEqual([]);
    });

    it('should handle undefined input', () => {
      expect(decodeStringArray(undefined)).toEqual([]);
    });

    it('should handle empty string', () => {
      expect(decodeStringArray('')).toEqual([]);
    });

    it('should handle invalid JSON', () => {
      expect(decodeStringArray('not valid json')).toEqual([]);
    });

    it('should handle non-array JSON', () => {
      expect(decodeStringArray('{"key": "value"}')).toEqual([]);
    });
  });

  describe('encodeJsonArray', () => {
    it('should encode object array', () => {
      const data = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      const result = encodeJsonArray(data);
      expect(JSON.parse(result)).toEqual(data);
    });
  });

  describe('decodeJsonArray', () => {
    it('should decode to object array', () => {
      const json = '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]';
      const result = decodeJsonArray<{ id: number; name: string }>(json);
      expect(result).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });

    it('should handle null', () => {
      expect(decodeJsonArray(null)).toEqual([]);
    });
  });

  describe('encodeEnumArray', () => {
    it('should encode enum array', () => {
      type Stage = 'IDEA' | 'MVP' | 'GROWTH';
      const stages: Stage[] = ['IDEA', 'MVP'];
      const result = encodeEnumArray(stages);
      expect(result).toBe('["IDEA","MVP"]');
    });
  });

  describe('decodeEnumArray', () => {
    it('should decode enum array', () => {
      type Stage = 'IDEA' | 'MVP' | 'GROWTH';
      const result = decodeEnumArray<Stage>('["IDEA","MVP"]');
      expect(result).toEqual(['IDEA', 'MVP']);
    });
  });

  describe('round-trip encoding', () => {
    it('should preserve data through encode/decode cycle', () => {
      const original = ['AI', 'Blockchain', 'SaaS', 'FinTech'];
      const encoded = encodeStringArray(original);
      const decoded = decodeStringArray(encoded);
      expect(decoded).toEqual(original);
    });
  });
});
