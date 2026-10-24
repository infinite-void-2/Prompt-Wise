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
  constructor(private geminiService: IGeminiService) {}

  /**
   * Concurrently count tokens for the raw prompt, highContext variant, and lowToken variant
   * using Gemini's native countTokens API.
   */
  async countAllTokens(params: {
    model: string;
    rawPrompt: string;
    highContext: string;
    lowToken: string;
  }): Promise<TokenCountResults> {
    const { model, rawPrompt, highContext, lowToken } = params;
    const warnings: Array<{ code: string; message: string }> = [];

    const [rawRes, highRes, lowRes] = await Promise.allSettled([
      this.geminiService.countTokens({ model, contents: rawPrompt }),
      this.geminiService.countTokens({ model, contents: highContext }),
      this.geminiService.countTokens({ model, contents: lowToken }),
    ]);

    let rawTokens: number | null = null;
    let highContextTokens: number | null = null;
    let lowTokenTokens: number | null = null;

    if (rawRes.status === 'fulfilled') {
      rawTokens = rawRes.value;
    } else {
      warnings.push({
        code: 'TOKEN_COUNT_RAW_FAILED',
        message: 'Could not count tokens for original prompt via Gemini API.',
      });
    }

    if (highRes.status === 'fulfilled') {
      highContextTokens = highRes.value;
    } else {
      warnings.push({
        code: 'TOKEN_COUNT_HIGH_FAILED',
        message: 'Could not count tokens for High-Context variant via Gemini API.',
      });
    }

    if (lowRes.status === 'fulfilled') {
      lowTokenTokens = lowRes.value;
    } else {
      warnings.push({
        code: 'TOKEN_COUNT_LOW_FAILED',
        message: 'Could not count tokens for Low-Token variant via Gemini API.',
      });
    }

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
   * Calculates an estimated prompt input cost based on the official configured pricing table.
   */
  calculateCostEstimate(rawTokens: number | null, model = config.GEMINI_MODEL): CostEstimate | null {
    if (rawTokens === null) {
      return {
        inputCost: null,
        currency: config.PRICING.currency,
        isEstimate: true,
        assumptions: config.PRICING.assumptions,
      };
    }

    const cost = (rawTokens / 1_000_000) * config.PRICING.inputCostPerMillion;
    return {
      inputCost: Number(cost.toFixed(6)),
      currency: config.PRICING.currency,
      isEstimate: true,
      assumptions: [
        ...config.PRICING.assumptions,
        `Calculated for model ${model} at $${config.PRICING.inputCostPerMillion} per million input tokens.`,
      ],
    };
  }

  /**
   * Combines token counts and calculates final analytics metrics.
   */
  computeMetrics(
    counts: { rawTokens: number | null; highContextTokens: number | null; lowTokenTokens: number | null },
    model: string
  ): Metrics {
    const { rawTokens, highContextTokens, lowTokenTokens } = counts;

    return {
      rawTokens,
      highContextTokens,
      lowTokenTokens,
      highContextChangePercent: this.calculateChangePercent(rawTokens, highContextTokens),
      lowTokenReductionPercent: this.calculateReductionPercent(rawTokens, lowTokenTokens),
      measuredWith: `Gemini Native API (${model})`,
      costEstimate: this.calculateCostEstimate(rawTokens, model),
    };
  }
}
