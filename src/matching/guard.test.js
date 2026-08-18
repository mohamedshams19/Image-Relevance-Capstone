import { describe, it, expect } from 'vitest';
import { evaluateMatch } from './guard.js';

describe('evaluateMatch (mismatch guard)', () => {
  const foxPost = {
    title: 'The Behavior of Red Foxes',
    content: 'Red foxes are highly adaptable animals found across forests and grasslands.'
  };

  it('rejects a wolf image on a fox post even with reasonable similarity', () => {
    const wolfImage = { subject: 'wolf', confidence: 0.9 };
    const result = evaluateMatch(foxPost, wolfImage, 0.55);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/mismatch/i);
  });

  it('passes a fox image on a fox post with good similarity and confidence', () => {
    const foxImage = { subject: 'fox', confidence: 0.9 };
    const result = evaluateMatch(foxPost, foxImage, 0.6);
    expect(result.passed).toBe(true);
  });

  it('rejects any image with low vision confidence, regardless of similarity', () => {
    const lowConfidenceImage = { subject: 'fox', confidence: 0.3 };
    const result = evaluateMatch(foxPost, lowConfidenceImage, 0.9);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/confidence/i);
  });

  it('rejects a match with similarity below threshold', () => {
    const foxImage = { subject: 'fox', confidence: 0.9 };
    const result = evaluateMatch(foxPost, foxImage, 0.1);
    expect(result.passed).toBe(false);
    expect(result.reason).toMatch(/similarity/i);
  });
});