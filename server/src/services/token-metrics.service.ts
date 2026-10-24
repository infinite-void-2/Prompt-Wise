import { config } from '../config/env.js';
import { CostEstimate, Metrics } from '../schemas/optimization.schema.js';
import { IGeminiService } from './gemini.service.js';

export interface TokenCountResults {
  rawTokens: number | null;
  highContextTokens: number | null;
  lowTokenTokens: number | null;
  warnings: Array<{ code: string; message: string }>;
}

export class TokenMetricsService {
  private tokenCache = new Map<string, number>();
  private readonly MAX_CACHE_ENTRIES = 1000;

  constructor(private geminiService: IGeminiService) {}

  /**
   * Count tokens for a single text string using cache and bounded fallback.
   */
  async countSingleWithCache(model: string, contents: string): Promise<number> {
    if (!contents || contents.trim() === '') return 0;

    const cacheKey = `${model}:${contents.length}:${contents}`;
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!;
    }

    const count = await this.geminiService.countTokens({ model, contents });
    if (this.tokenCache.size >= this.MAX_CACHE_ENTRIES) {
      const oldestKey = this.tokenCache.keys().next().value;
      if (oldestKey) this.tokenCache.delete(oldestKey);
    }
    this.tokenCache.set(cacheKey, count);
    return count;
  }

  /**
   * Concurrently count tokens for the raw prompt, highContext variant, and lowToken variant
   * using Gemini's native countTokens API with deduplication, caching, and pre-computed raw count support.
   */
  async countAllTokens(params: {
    model: string;
    rawPrompt: string;
    highContext: string;
    lowToken: string;
    precomputedRawTokens?: number | null;
  }): Promise<TokenCountResults> {
    const { model, rawPrompt, highContext, lowToken, precomputedRawTokens } = params;
    const warnings: Array<{ code: string; message: string }> = [];

    let rawTokens: number | null = precomputedRawTokens ?? null;
    let highContextTokens: number | null = null;
    let lowTokenTokens: number | null = null;

    // Deduplication checks across variants
    const highMatchesRaw = highContext.trim() === rawPrompt.trim();
    const lowMatchesRaw = lowToken.trim() === rawPrompt.trim();
    const lowMatchesHigh = lowToken.trim() === highContext.trim();

    const tasks: Array<Promise<void>> = [];

    // 1. Raw prompt count
    const rawPromise: Promise<number> =
      rawTokens !== null
        ? Promise.resolve(rawTokens)
        : this.countSingleWithCache(model, rawPrompt);

    tasks.push(
      rawPromise
        .then((val) => {
          rawTokens = val;
        })
        .catch(() => {
          warnings.push({
            code: 'TOKEN_COUNT_RAW_FAILED',
            message: 'Could not count tokens for original prompt via Gemini API.',
          });
        })
    );

    // 2. High Context count (share rawPromise if identical)
    const highPromise: Promise<number> = highMatchesRaw
      ? rawPromise
      : this.countSingleWithCache(model, highContext);

    tasks.push(
      highPromise
        .then((val) => {
          highContextTokens = val;
        })
        .catch(() => {
          warnings.push({
            code: 'TOKEN_COUNT_HIGH_FAILED',
            message: 'Could not count tokens for High-Context variant via Gemini API.',
          });
        })
    );

    // 3. Low Token count (share rawPromise or highPromise if identical)
    const lowPromise: Promise<number> = lowMatchesRaw
      ? rawPromise
      : lowMatchesHigh
      ? highPromise
      : this.countSingleWithCache(model, lowToken);

    tasks.push(
      lowPromise
        .then((val) => {
          lowTokenTokens = val;
        })
        .catch(() => {
          warnings.push({
            code: 'TOKEN_COUNT_LOW_FAILED',
            message: 'Could not count tokens for Low-Token variant via Gemini API.',
          });
        })
    );

    await Promise.all(tasks);

    return {
      rawTokens,
      highContextTokens,
      lowTokenTokens,
      warnings,
    };
  }

  /**
   * Zero-safe percentage calculation for low-token reduction.
   * e.g., raw=100, low=70 => 30 (representing 30% reduction).
   * raw=100, low=120 => -20 (signed change: 20% increase).
   * raw=0 or null => null.
   */
  calculateReductionPercent(rawTokens: number | null, variantTokens: number | null): number | null {
    if (rawTokens === null || variantTokens === null || rawTokens <= 0) {
      return null;
    }
    const delta = rawTokens - variantTokens;
    return Number(((delta / rawTokens) * 100).toFixed(1));
  }

  /**
   * Zero-safe percentage calculation for high-context change.
   * e.g., raw=100, high=125 => +25.0%.
   */
  calculateChangePercent(rawTokens: number | null, variantTokens: number | null): number | null {
    if (rawTokens === null || variantTokens === null || rawTokens <= 0) {
      return null;
    }
    const delta = variantTokens - rawTokens;
    return Number(((delta / rawTokens) * 100).toFixed(1));
  }

  /**
   * Estimates output token count based on task category and length constraints.
   */
  estimateOutputTokens(taskCategory?: string, lengthLimit?: string | null): number {
    if (lengthLimit) {
      const wordMatch = lengthLimit.match(/(\d+)\s*words?/i);
      if (wordMatch) {
        return Math.max(10, Math.round(parseInt(wordMatch[1], 10) * 1.33));
      }
    }

    switch (taskCategory) {
      case 'Data Extraction':
        return 90;
      case 'Summarization':
        return 180;
      case 'Coding':
        return 260;
      case 'Reasoning':
        return 320;
      case 'Writing':
        return 240;
      case 'Creative':
        return 220;
      default:
        return 160;
    }
  }

  /**
   * Calculates a comprehensive two-way prompt cost estimate (input prompt tokens + predicted output tokens).
   */
  calculateCostEstimate(
    rawTokens: number | null,
    model = config.GEMINI_MODEL,
    taskCategory?: string,
    lengthLimit?: string | null
  ): CostEstimate | null {
    if (rawTokens === null) {
      return {
        inputCost: null,
        estimatedOutputTokens: null,
        estimatedOutputCost: null,
        totalCostPerCall: null,
        costPer1kCalls: null,
        currency: config.PRICING.currency,
        isEstimate: true,
        assumptions: config.PRICING.assumptions,
      };
    }

    const inputCost = Number(((rawTokens / 1_000_000) * config.PRICING.inputCostPerMillion).toFixed(6));
    const estimatedOutputTokens = this.estimateOutputTokens(taskCategory, lengthLimit);
    const estimatedOutputCost = Number(
      ((estimatedOutputTokens / 1_000_000) * config.PRICING.outputCostPerMillion).toFixed(6)
    );
    const totalCostPerCall = Number((inputCost + estimatedOutputCost).toFixed(6));
    const costPer1kCalls = Number((totalCostPerCall * 1000).toFixed(4));

    return {
      inputCost,
      estimatedOutputTokens,
      estimatedOutputCost,
      totalCostPerCall,
      costPer1kCalls,
      currency: config.PRICING.currency,
      isEstimate: true,
      assumptions: [
        ...config.PRICING.assumptions,
        `Input token rate: $${config.PRICING.inputCostPerMillion}/1M tokens ($0.075).`,
        `Output token rate: $${config.PRICING.outputCostPerMillion}/1M tokens ($0.30).`,
        `Estimated output: ~${estimatedOutputTokens} tokens based on task type "${taskCategory || 'General'}".`,
      ],
    };
  }

  /**
   * Combines token counts and calculates final analytics metrics.
   */
  computeMetrics(
    counts: { rawTokens: number | null; highContextTokens: number | null; lowTokenTokens: number | null },
    model: string,
    taskCategory?: string,
    lengthLimit?: string | null
  ): Metrics {
    const { rawTokens, highContextTokens, lowTokenTokens } = counts;

    return {
      rawTokens,
      highContextTokens,
      lowTokenTokens,
      highContextChangePercent: this.calculateChangePercent(rawTokens, highContextTokens),
      lowTokenReductionPercent: this.calculateReductionPercent(rawTokens, lowTokenTokens),
      measuredWith: `Gemini Native API (${model})`,
      costEstimate: this.calculateCostEstimate(rawTokens, model, taskCategory, lengthLimit),
    };
  }

  /**
   * Clear cache (useful for testing and memory resets).
   */
  clearCache(): void {
    this.tokenCache.clear();
  }
}
