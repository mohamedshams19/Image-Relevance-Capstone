import { describe, it, expect } from 'vitest';
import { VisionResultSchema } from './schema.js';

describe('VisionResultSchema', () => {
  it('accepts a valid vision result', () => {
    const valid = {
      subject: 'red fox',
      category: 'animal',
      attributes: ['orange fur', 'wild'],
      caption: 'A red fox in a forest',
      confidence: 0.94
    };
    const result = VisionResultSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects a result with an invalid category', () => {
    const invalid = {
      subject: 'red fox',
      category: 'not-a-real-category',
      attributes: ['orange fur'],
      caption: 'A red fox',
      confidence: 0.94
    };
    const result = VisionResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects a confidence value above 1', () => {
    const invalid = {
      subject: 'red fox',
      category: 'animal',
      attributes: ['orange fur'],
      caption: 'A red fox',
      confidence: 1.5
    };
    const result = VisionResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects a missing subject', () => {
    const invalid = {
      category: 'animal',
      attributes: ['orange fur'],
      caption: 'A red fox',
      confidence: 0.94
    };
    const result = VisionResultSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});