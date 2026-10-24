import { describe, expect, it } from 'vitest';
import { FakeGeminiService } from '../../src/services/gemini.service.js';
import { TokenMetricsService } from '../../src/services/token-metrics.service.js';

describe('TokenMetricsService - Caching, Deduplication & Two-Way Cost', () => {
  it('hits cache on repeated calls and avoids duplicate network requests', async () => {
    let apiCallCount = 0;
    const fakeGemini = new FakeGeminiService(
      undefined,
      async (params) => {
        apiCallCount++;
        return 25;
      }
    );

    const service = new TokenMetricsService(fakeGemini);

    // Call 1: Miss -> API called
    const count1 = await service.countSingleWithCache('gemini-3.8-flash', 'Hello world caching test');
    expect(count1).toBe(25);
    expect(apiCallCount).toBe(1);

    // Call 2: Hit -> No API call
    const count2 = await service.countSingleWithCache('gemini-3.8-flash', 'Hello world caching test');
    expect(count2).toBe(25);
    expect(apiCallCount).toBe(1); // Still 1!
  });

  it('deduplicates variant counting when lowToken is identical to rawPrompt', async () => {
    let apiCallCount = 0;
    const fakeGemini = new FakeGeminiService(
      undefined,
      async () => {
        apiCallCount++;
        return 15;
      }
    );

    const service = new TokenMetricsService(fakeGemini);

    // When lowToken is identical to rawPrompt (e.g. Case 19: No safe compression)
    const counts = await service.countAllTokens({
      model: 'gemini-3.8-flash',
      rawPrompt: 'Sort array in place with quicksort',
      highContext: 'Objective: Sort array in place with quicksort',
      lowToken: 'Sort array in place with quicksort', // identical!
    });

    expect(counts.rawTokens).toBe(15);
    expect(counts.lowTokenTokens).toBe(15);
    // Only rawPrompt and highContext were distinct, so at most 2 API calls
    expect(apiCallCount).toBeLessThanOrEqual(2);
  });

  it('correctly calculates two-way cost with input and predicted output tokens', () => {
    const service = new TokenMetricsService(new FakeGeminiService());

    // 100 raw tokens in Coding category
    const cost = service.calculateCostEstimate(100, 'gemini-3.8-flash', 'Coding', null);

    expect(cost).not.toBeNull();
    expect(cost?.inputCost).toBe(0.000008); // 100 / 1M * 0.075 = 0.0000075 -> rounded to 0.000008
    expect(cost?.estimatedOutputTokens).toBe(260); // Coding category prior
    expect(cost?.estimatedOutputCost).toBe(0.000078); // 260 / 1M * 0.30 = 0.000078
    expect(cost?.totalCostPerCall).toBe(0.000086); // input + output
    expect(cost?.costPer1kCalls).toBe(0.086); // total * 1000
    expect(cost?.assumptions).toHaveLength(6);
  });

  it('respects explicit length limits when predicting output tokens', () => {
    const service = new TokenMetricsService(new FakeGeminiService());

    // Prompt specifies "under 50 words"
    const cost = service.calculateCostEstimate(50, 'gemini-3.8-flash', 'Writing', 'under 50 words');

    expect(cost?.estimatedOutputTokens).toBe(67); // 50 * 1.33 ≈ 67
  });
});
