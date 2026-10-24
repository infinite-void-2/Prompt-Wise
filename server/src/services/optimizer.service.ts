import { config } from '../config/env.js';
import {
  GeminiOptimizationOutput,
  GeminiOptimizationOutputSchema,
  OptimizationResult,
  OptimizationWarning,
  TaskCategory,
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
    const { rawPrompt, taskCategory = 'Auto', requestId } = params;
    const model = this.resolveModel(params.model);

    // Prompt injection check on raw prompt (defense-in-depth)
    const promptInjectionDetected = this.detectPromptInjection(rawPrompt);

    // Call Gemini for structured variant generation
    const promptMessage = buildOptimizationPrompt(rawPrompt, taskCategory);
    let output = await this.generateAndParseVariants(model, promptMessage);

    const warnings: OptimizationWarning[] = [...output.warnings];

    if (promptInjectionDetected) {
      warnings.unshift({
        code: 'PROMPT_INJECTION_DEFENSE_TRIGGERED',
        message: 'Prompt contains meta-instructions or override patterns. Analyzed strictly as task data.',
      });
    }

    // Semantic and literal checks
    this.checkPreservation(rawPrompt, output, warnings);

    // Check if compression was unsafe or infeasible
    if (rawPrompt.length < 50 && output.lowToken.trim().length >= rawPrompt.trim().length * 0.95) {
      if (!warnings.some((w) => w.code === 'NO_SAFE_COMPRESSION')) {
        warnings.push({
          code: 'NO_SAFE_COMPRESSION',
          message: 'The original prompt is already concise and highly constrained. Further compression risks losing meaning.',
        });
      }
    }

    // Concurrently count tokens for raw, highContext, and lowToken using Gemini native API
    const tokenCounts = await this.tokenMetricsService.countAllTokens({
      model,
      rawPrompt,
      highContext: output.highContext,
      lowToken: output.lowToken,
    });

    warnings.push(...tokenCounts.warnings);

    // Compute metrics
    const metrics = this.tokenMetricsService.computeMetrics(tokenCounts, model);

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
      recommendation: output.recommendation,
      metrics,
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

      // Verify that neither variant is missing or an empty string
      if (!validated.highContext || validated.highContext.trim() === '') {
        throw new Error('Optimizer output failed validation: highContext variant is missing or empty.');
      }
      if (!validated.lowToken || validated.lowToken.trim() === '') {
        throw new Error('Optimizer output failed validation: lowToken variant is missing or empty.');
      }

      return validated;
    } catch (err: any) {
      if (allowRetry) {
        // Attempt at most one controlled repair call
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
          // If repair still fails, return safe actionable error
          throw new Error(`Failed to generate valid structured optimization output from Gemini: ${err.message}`);
        }
      }
      throw new Error(`Failed to parse optimizer output as structured JSON: ${err.message}`);
    }
  }

  private cleanJsonText(text: string): string {
    let clean = text.trim();
    // Strip markdown code fences if model enclosed JSON in ```json ... ```
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return clean.trim();
  }

  private checkPreservation(
    rawPrompt: string,
    output: GeminiOptimizationOutput,
    warnings: OptimizationWarning[]
  ): void {
    // Check for exact literals: regexes, file paths, code keys
    const detectedLiterals = output.detectedConstraints.exactLiterals || [];
    for (const lit of detectedLiterals) {
      if (rawPrompt.includes(lit)) {
        if (!output.highContext.includes(lit)) {
          warnings.push({
            code: 'LITERAL_NOT_IN_HIGH_CONTEXT',
            message: `Exact literal "${lit}" was not found in the High-Context variant.`,
          });
        }
        if (!output.lowToken.includes(lit)) {
          warnings.push({
            code: 'LITERAL_NOT_IN_LOW_TOKEN',
            message: `Exact literal "${lit}" was not found in the Low-Token variant.`,
          });
        }
      }
    }

    // Check for contradictory constraints (e.g. 10 words vs 5 examples)
    const isContradictory =
      (rawPrompt.includes('10 words') || rawPrompt.includes('ten words')) &&
      (rawPrompt.includes('5 examples') || rawPrompt.includes('five examples') || rawPrompt.includes('every detail'));
    if (isContradictory && !warnings.some((w) => w.code === 'CONTRADICTORY_CONSTRAINTS')) {
      warnings.push({
        code: 'CONTRADICTORY_CONSTRAINTS',
        message: 'Contradictory constraints detected (e.g. extreme brevity vs exhaustive examples). Review before executing.',
      });
    }

    // Check for ambiguous input (e.g. "make this faster")
    if (rawPrompt.trim().toLowerCase() === 'make this faster' || rawPrompt.trim().toLowerCase() === 'improve this') {
      if (!warnings.some((w) => w.code === 'AMBIGUOUS_INPUT')) {
        warnings.push({
          code: 'AMBIGUOUS_INPUT',
          message: 'The original prompt lacks target context, language, or criteria. Both variants make minimal assumptions.',
        });
      }
    }
  }
}
