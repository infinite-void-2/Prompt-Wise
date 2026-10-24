import { config } from '../config/env.js';
import { ExecutionRequest, ExecutionResult } from '../schemas/execution.schema.js';
import { IGeminiService } from './gemini.service.js';

export class ExecutorService {
  constructor(private geminiService: IGeminiService) {}

  async execute(params: ExecutionRequest, requestId: string): Promise<ExecutionResult> {
    const model = this.resolveModel(params.model);
    const startTime = Date.now();

    const result = await this.geminiService.generateContent({
      model,
      contents: params.prompt,
    });

    const latencyMs = Date.now() - startTime;

    return {
      requestId,
      prompt: params.prompt,
      response: result.text,
      model,
      latencyMs,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens ?? null,
            candidateTokens: result.usage.candidateTokens ?? null,
            totalTokens: result.usage.totalTokens ?? null,
          }
        : null,
      timestamp: new Date().toISOString(),
    };
  }

  private resolveModel(requestedModel?: string): string {
    if (!requestedModel) return config.GEMINI_MODEL;
    if (config.ALLOWED_MODELS.includes(requestedModel)) {
      return requestedModel;
    }
    return config.GEMINI_MODEL;
  }
}
