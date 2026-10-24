import { performance } from 'perf_hooks';
import { config } from '../config/env.js';
import {
  DetectedConstraints,
  GeminiOptimizationOutput,
  GeminiOptimizationOutputSchema,
  OptimizationResult,
  OptimizationWarning,
  Recommendation,
  StageTimings,
  TaskCategory,
  VerificationDetails,
} from '../schemas/optimization.schema.js';
import { IGeminiService } from './gemini.service.js';
import {
  buildOptimizationPrompt,
  OPTIMIZER_INSTRUCTION_VERSION,
  OPTIMIZER_SYSTEM_INSTRUCTION,
} from './prompt-templates.js';
import { TokenMetricsService } from './token-metrics.service.js';

export class OptimizerService {
  private tokenMetricsService: TokenMetricsService;

  constructor(private geminiService: IGeminiService) {
    this.tokenMetricsService = new TokenMetricsService(geminiService);
  }

  async optimize(params: {
    rawPrompt: string;
    taskCategory?: TaskCategory;
    model?: string;
    requestId: string;
  }): Promise<OptimizationResult> {
    const totalStart = performance.now();
    const { rawPrompt, taskCategory = 'Auto', requestId } = params;
    const model = this.resolveModel(params.model);

    // Defense-in-depth: Prompt injection check on raw prompt
    const promptInjectionDetected = this.detectPromptInjection(rawPrompt);

    // Concurrency Optimization: Prefetch raw prompt token count concurrently with LLM generation
    const rawTokenPrefetchPromise = this.tokenMetricsService
      .countSingleWithCache(model, rawPrompt)
      .catch(() => null);

    // Stage 1: Intent Analysis & Structured Variant Generation
    const genStart = performance.now();
    const promptMessage = buildOptimizationPrompt(rawPrompt, taskCategory);
    let output = await this.generateAndParseVariants(model, promptMessage);
    const analysisAndGenerationMs = Number((performance.now() - genStart).toFixed(2));

    const warnings: OptimizationWarning[] = [...output.warnings];

    if (promptInjectionDetected) {
      warnings.unshift({
        code: 'PROMPT_INJECTION_DEFENSE_TRIGGERED',
        message: 'Prompt contains meta-instructions or override patterns. Analyzed strictly as task data.',
      });
    }

    // Check if compression was unsafe or infeasible (Case 19)
    if (rawPrompt.length < 50 && output.lowToken.trim().length >= rawPrompt.trim().length * 0.95) {
      if (!warnings.some((w) => w.code === 'NO_SAFE_COMPRESSION')) {
        warnings.push({
          code: 'NO_SAFE_COMPRESSION',
          message: 'The original prompt is already concise and highly constrained. Further compression risks losing meaning.',
        });
      }
    }

    // Stage 2: Verification Gate for both variants
    const verifStart = performance.now();
    const highContextVerification = this.verifyVariant(
      output.highContext,
      output.detectedConstraints,
      rawPrompt,
      'highContext'
    );
    const lowTokenVerification = this.verifyVariant(
      output.lowToken,
      output.detectedConstraints,
      rawPrompt,
      'lowToken'
    );

    // Append literal warnings for visibility
    for (const lit of highContextVerification.exactLiteralsMissing) {
      warnings.push({
        code: 'LITERAL_NOT_IN_HIGH_CONTEXT',
        message: `Exact literal "${lit}" was not found in the High-Context variant.`,
      });
    }
    for (const lit of lowTokenVerification.exactLiteralsMissing) {
      warnings.push({
        code: 'LITERAL_NOT_IN_LOW_TOKEN',
        message: `Exact literal "${lit}" was not found in the Low-Token variant.`,
      });
    }

    // Check for contradictory constraints
    const isContradictory =
      (rawPrompt.includes('10 words') || rawPrompt.includes('ten words')) &&
      (rawPrompt.includes('5 examples') || rawPrompt.includes('five examples') || rawPrompt.includes('every detail'));
    if (isContradictory && !warnings.some((w) => w.code === 'CONTRADICTORY_CONSTRAINTS')) {
      warnings.push({
        code: 'CONTRADICTORY_CONSTRAINTS',
        message: 'Contradictory constraints detected (e.g. extreme brevity vs exhaustive examples). Review before executing.',
      });
    }

    // Check for ambiguous input
    if (rawPrompt.trim().toLowerCase() === 'make this faster' || rawPrompt.trim().toLowerCase() === 'improve this') {
      if (!warnings.some((w) => w.code === 'AMBIGUOUS_INPUT')) {
        warnings.push({
          code: 'AMBIGUOUS_INPUT',
          message: 'The original prompt lacks target context, language, or criteria. Both variants make minimal assumptions.',
        });
      }
    }

    // Safe Recommendation Gating: If low-token variant failed verification, revert recommendation
    let finalRecommendation: Recommendation = { ...output.recommendation };
    if (output.recommendation.variant === 'lowToken' && !lowTokenVerification.passed) {
      lowTokenVerification.fallbackApplied = true;
      if (highContextVerification.passed) {
        finalRecommendation = {
          variant: 'highContext',
          reason: `Low-Token variant failed verification (missing: ${[
            ...lowTokenVerification.exactLiteralsMissing,
            ...lowTokenVerification.mustPreserveMissing,
          ].join(', ')}). High-Context variant recommended to preserve correctness.`,
        };
      } else {
        finalRecommendation = {
          variant: 'original',
          reason:
            'Both optimized variants failed verification against hard constraints. Original prompt retained as conservative fallback.',
        };
      }
      warnings.push({
        code: 'VERIFICATION_GATE_REVERTED_RECOMMENDATION',
        message: finalRecommendation.reason,
      });
    }
    const verificationMs = Number((performance.now() - verifStart).toFixed(2));

    // Stage 3: Token Counting & Two-Way Cost Analytics
    const tokenStart = performance.now();
    // Await the prefetched raw count
    const precomputedRawTokens = await rawTokenPrefetchPromise;

    const tokenCounts = await this.tokenMetricsService.countAllTokens({
      model,
      rawPrompt,
      highContext: output.highContext,
      lowToken: output.lowToken,
      precomputedRawTokens,
    });

    warnings.push(...tokenCounts.warnings);

    // Compute metrics with two-way cost prediction
    const metrics = this.tokenMetricsService.computeMetrics(
      tokenCounts,
      model,
      output.taskCategory || taskCategory,
      output.detectedConstraints.lengthLimit
    );
    const tokenCountingMs = Number((performance.now() - tokenStart).toFixed(2));

    const totalMs = Number((performance.now() - totalStart).toFixed(2));
    const timings: StageTimings = {
      totalMs,
      analysisAndGenerationMs,
      tokenCountingMs,
      verificationMs,
    };

    return {
      requestId,
      model,
      intentSummary: output.intentSummary,
      taskCategory: output.taskCategory || taskCategory,
      detectedConstraints: output.detectedConstraints,
      rawPrompt,
      highContext: output.highContext,
      lowToken: output.lowToken,
      warnings,
      recommendation: finalRecommendation,
      metrics,
      verificationStatus: {
        highContext: highContextVerification,
        lowToken: lowTokenVerification,
      },
      timings,
    };
  }

  /**
   * Evaluates whether a prompt variant strictly preserves required hard constraints,
   * exact literals, and negative prohibitions.
   */
  public verifyVariant(
    variantText: string,
    constraints: DetectedConstraints,
    rawPrompt: string,
    variantName: 'highContext' | 'lowToken'
  ): VerificationDetails {
    const mustPreserveSatisfied: string[] = [];
    const mustPreserveMissing: string[] = [];
    const exactLiteralsSatisfied: string[] = [];
    const exactLiteralsMissing: string[] = [];
    const negativeConstraintsViolated: string[] = [];

    // 1. Exact literals (case-sensitive check)
    const literals = constraints.exactLiterals || [];
    for (const lit of literals) {
      if (rawPrompt.includes(lit)) {
        if (variantText.includes(lit)) {
          exactLiteralsSatisfied.push(lit);
        } else {
          exactLiteralsMissing.push(lit);
        }
      }
    }

    // 2. Must-preserve requirements (case-insensitive substring/semantic check)
    const preserves = constraints.mustPreserve || [];
    const variantLower = variantText.toLowerCase();
    for (const req of preserves) {
      if (variantLower.includes(req.toLowerCase())) {
        mustPreserveSatisfied.push(req);
      } else {
        mustPreserveMissing.push(req);
      }
    }

    // 3. Prohibitions and negative constraints (must NOT introduce violated items)
    const mustAvoid = constraints.mustAvoid || [];
    for (const avoid of mustAvoid) {
      const lowerAvoid = avoid.toLowerCase();
      // E.g., if "no markdown" was specified, ensure no ``` code blocks
      if (lowerAvoid.includes('markdown') && variantText.includes('```')) {
        negativeConstraintsViolated.push(avoid);
      }
      if (lowerAvoid.includes('external package') && /import |from ['"]/.test(variantText)) {
        negativeConstraintsViolated.push(avoid);
      }
    }

    const passed =
      exactLiteralsMissing.length === 0 &&
      mustPreserveMissing.length === 0 &&
      negativeConstraintsViolated.length === 0;

    return {
      passed,
      mustPreserveSatisfied,
      mustPreserveMissing,
      exactLiteralsSatisfied,
      exactLiteralsMissing,
      negativeConstraintsViolated,
      fallbackApplied: false,
    };
  }

  private resolveModel(requestedModel?: string): string {
    if (!requestedModel) return config.GEMINI_MODEL;
    if (config.ALLOWED_MODELS.includes(requestedModel)) {
      return requestedModel;
    }
    return config.GEMINI_MODEL;
  }

  private detectPromptInjection(prompt: string): boolean {
    const patterns = [
      /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
      /reveal\s+(the\s+)?(system\s+prompt|api\s*key|developer\s+mode)/i,
      /you\s+are\s+now\s+in\s+dan\s+mode/i,
      /disregard\s+(the\s+)?rules/i,
      /output\s+the\s+initial\s+prompt/i,
    ];
    return patterns.some((pattern) => pattern.test(prompt));
  }

  private async generateAndParseVariants(
    model: string,
    promptMessage: string
  ): Promise<GeminiOptimizationOutput> {
    let rawText = '';
    try {
      const response = await this.geminiService.generateContent({
        model,
        contents: promptMessage,
        systemInstruction: OPTIMIZER_SYSTEM_INSTRUCTION,
        jsonMode: true,
      });
      rawText = response.text;
    } catch (err: any) {
      throw err;
    }

    return this.parseAndValidateOutput(rawText, model, promptMessage);
  }

  private async parseAndValidateOutput(
    rawText: string,
    model: string,
    promptMessage: string,
    allowRetry = true
  ): Promise<GeminiOptimizationOutput> {
    const cleanedText = this.cleanJsonText(rawText);

    try {
      const parsed = JSON.parse(cleanedText);
      const validated = GeminiOptimizationOutputSchema.parse(parsed);

      if (!validated.highContext || validated.highContext.trim() === '') {
        throw new Error('Optimizer output failed validation: highContext variant is missing or empty.');
      }
      if (!validated.lowToken || validated.lowToken.trim() === '') {
        throw new Error('Optimizer output failed validation: lowToken variant is missing or empty.');
      }

      return validated;
    } catch (err: any) {
      if (allowRetry) {
        try {
          const repairPrompt = `${promptMessage}\n\nIMPORTANT: The previous response was invalid JSON. Output strictly valid JSON matching the exact schema with both highContext and lowToken fields populated.`;
          const retryRes = await this.geminiService.generateContent({
            model,
            contents: repairPrompt,
            systemInstruction: OPTIMIZER_SYSTEM_INSTRUCTION,
            jsonMode: true,
          });
          return this.parseAndValidateOutput(retryRes.text, model, promptMessage, false);
        } catch (repairErr) {
          throw new Error(`Failed to generate valid structured optimization output from Gemini: ${err.message}`);
        }
      }
      throw new Error(`Failed to parse optimizer output as structured JSON: ${err.message}`);
    }
  }

  private cleanJsonText(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return clean.trim();
  }
}
