import { describe, expect, it } from 'vitest';
import { config } from '../../src/config/env.js';
import {
  GeminiOptimizationOutputSchema,
  OptimizationRequestSchema,
} from '../../src/schemas/optimization.schema.js';

describe('Validation Schemas Unit Tests', () => {
  // Case 1: Whitespace-only prompt rejected
  it('Case 01: rejects whitespace-only prompt with a validation error', () => {
    const result = OptimizationRequestSchema.safeParse({ rawPrompt: '   \n\t  ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('empty or whitespace-only');
    }
  });

  // Case 2: Missing prompt field rejected
  it('Case 02: rejects payload when rawPrompt is missing', () => {
    const result = OptimizationRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('rawPrompt');
    }
  });

  // Case 3: Prompt exceeds configured maximum length
  it('Case 03: rejects prompt exceeding max length constraint', () => {
    const oversized = 'A'.repeat(config.MAX_PROMPT_CHARS + 10);
    const result = OptimizationRequestSchema.safeParse({ rawPrompt: oversized });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('exceeds maximum allowed length');
    }
  });

  // Case 8: Valid structured optimizer output parses correctly
  it('Case 08: parses valid structured optimizer output and constraint metadata', () => {
    const validOutput = {
      intentSummary: 'Unit test intent',
      taskCategory: 'Coding',
      detectedConstraints: {
        mustPreserve: ['preserve this'],
        outputFormat: 'JSON',
        lengthLimit: '50 words',
        language: 'en',
        mustAvoid: ['no external libraries'],
        exactLiterals: ['user_id'],
      },
      highContext: 'High-context structured prompt',
      lowToken: 'Low-token prompt',
      warnings: [],
      recommendation: {
        variant: 'lowToken',
        reason: 'Optimal compression',
      },
    };

    const parsed = GeminiOptimizationOutputSchema.parse(validOutput);
    expect(parsed.highContext).toBe('High-context structured prompt');
    expect(parsed.detectedConstraints.exactLiterals).toContain('user_id');
  });

  // Case 10: Missing High-Context variant is detected and rejected
  it('Case 10: rejects output when highContext is missing', () => {
    const invalidOutput = {
      intentSummary: 'Intent',
      taskCategory: 'Coding',
      lowToken: 'Low-token only prompt',
    };

    const result = GeminiOptimizationOutputSchema.safeParse(invalidOutput);
    expect(result.success).toBe(false);
  });

  // Case 11: Missing Low-Token variant is detected and rejected
  it('Case 11: rejects output when lowToken is missing', () => {
    const invalidOutput = {
      intentSummary: 'Intent',
      taskCategory: 'Coding',
      highContext: 'High-context only prompt',
    };

    const result = GeminiOptimizationOutputSchema.safeParse(invalidOutput);
    expect(result.success).toBe(false);
  });
});
