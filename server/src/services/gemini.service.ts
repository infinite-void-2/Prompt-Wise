import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

export interface GenerateContentParams {
  model: string;
  contents: string;
  systemInstruction?: string;
  jsonMode?: boolean;
}

export interface GenerateContentResult {
  text: string;
  usage?: {
    promptTokens?: number;
    candidateTokens?: number;
    totalTokens?: number;
  };
}

export interface CountTokensParams {
  model: string;
  contents: string;
}

export interface IGeminiService {
  generateContent(params: GenerateContentParams): Promise<GenerateContentResult>;
  countTokens(params: CountTokensParams): Promise<number>;
}

export class GeminiConfigError extends Error {
  constructor(message = 'Gemini API key is not configured on the server') {
    super(message);
    this.name = 'GeminiConfigError';
  }
}

export class GeminiRateLimitError extends Error {
  constructor(message = 'Gemini API quota or rate limit exceeded. Please wait and retry.') {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

export class GeminiProviderError extends Error {
  public statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'GeminiProviderError';
    this.statusCode = statusCode;
  }
}

export class GeminiService implements IGeminiService {
  private client: GoogleGenAI | null = null;
  private apiKey: string;

  constructor(apiKey = config.GEMINI_API_KEY) {
    this.apiKey = apiKey;
    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.client || !this.apiKey) {
      if (!config.GEMINI_API_KEY) {
        throw new GeminiConfigError();
      }
      this.apiKey = config.GEMINI_API_KEY;
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const client = this.getClient();

    let attempts = 0;
    const maxRetries = 1; // At most 1 bounded retry for transient failures

    while (attempts <= maxRetries) {
      try {
        const generationConfig: any = {};
        if (params.jsonMode) {
          generationConfig.responseMimeType = 'application/json';
        }
        if (params.systemInstruction) {
          generationConfig.systemInstruction = params.systemInstruction;
        }

        const timeoutMs = config.REQUEST_TIMEOUT_MS || 30000;
        const generatePromise = client.models.generateContent({
          model: params.model,
          contents: params.contents,
          config: generationConfig,
        });

        let timer: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new GeminiProviderError(`Gemini request timed out after ${timeoutMs / 1000}s`, 504));
          }, timeoutMs);
        });

        const response = await Promise.race([generatePromise, timeoutPromise]).finally(() => {
          if (timer) clearTimeout(timer);
        });

        const text = response.text || '';
        const usageMetadata = (response as any).usageMetadata;

        return {
          text,
          usage: usageMetadata
            ? {
                promptTokens: usageMetadata.promptTokenCount ?? null,
                candidateTokens: usageMetadata.candidatesTokenCount ?? null,
                totalTokens: usageMetadata.totalTokenCount ?? null,
              }
            : undefined,
        };
      } catch (err: any) {
        attempts++;
        const status = err?.status || err?.statusCode || (err?.response && err.response.status);
        const msg = String(err?.message || err);

        // Sanitize error message to ensure no API key is leaked
        const sanitizedMsg = this.sanitizeErrorMessage(msg);

        // Quota / Rate limit (429) -> Do not loop indefinitely, throw clear rate limit error
        if (status === 429 || sanitizedMsg.includes('429') || sanitizedMsg.toLowerCase().includes('quota') || sanitizedMsg.toLowerCase().includes('rate limit')) {
          throw new GeminiRateLimitError(sanitizedMsg);
        }

        // Invalid API Key (400 or 403 or specific auth error)
        if (status === 401 || status === 403 || sanitizedMsg.toLowerCase().includes('api key not valid') || sanitizedMsg.toLowerCase().includes('unauthenticated')) {
          throw new GeminiConfigError('Gemini API key is invalid or unauthenticated');
        }

        // Retry once for transient 5xx or network timeouts
        const isTransient = status >= 500 || sanitizedMsg.includes('fetch failed') || sanitizedMsg.includes('timeout') || sanitizedMsg.includes('ECONNRESET');
        if (isTransient && attempts <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        throw new GeminiProviderError(sanitizedMsg, status);
      }
    }

    throw new GeminiProviderError('Failed to generate content after retry');
  }

  async countTokens(params: CountTokensParams): Promise<number> {
    const client = this.getClient();

    try {
      const timeoutMs = config.REQUEST_TIMEOUT_MS || 30000;
      const countPromise = client.models.countTokens({
        model: params.model,
        contents: params.contents,
      });

      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new GeminiProviderError(`Gemini countTokens request timed out after ${timeoutMs / 1000}s`, 504));
        }, timeoutMs);
      });

      const response = await Promise.race([countPromise, timeoutPromise]).finally(() => {
        if (timer) clearTimeout(timer);
      });

      if (response && typeof response.totalTokens === 'number') {
        return response.totalTokens;
      }
      throw new Error('countTokens did not return a valid totalTokens number');
    } catch (err: any) {
      const status = err?.status || err?.statusCode;
      const sanitizedMsg = this.sanitizeErrorMessage(String(err?.message || err));

      if (status === 429 || sanitizedMsg.includes('429') || sanitizedMsg.toLowerCase().includes('quota')) {
        throw new GeminiRateLimitError(sanitizedMsg);
      }
      throw new GeminiProviderError(sanitizedMsg, status);
    }
  }

  private sanitizeErrorMessage(msg: string): string {
    if (!this.apiKey) return msg;
    // Mask any occurrence of the API key
    return msg.split(this.apiKey).join('[REDACTED_API_KEY]');
  }
}

/**
 * FakeGeminiService for offline testing and deterministic golden evaluations.
 */
export class FakeGeminiService implements IGeminiService {
  public generateHandler?: (params: GenerateContentParams) => Promise<GenerateContentResult>;
  public countTokensHandler?: (params: CountTokensParams) => Promise<number>;
  public calls: { generate: GenerateContentParams[]; count: CountTokensParams[] } = {
    generate: [],
    count: [],
  };

  constructor(
    generateHandler?: (params: GenerateContentParams) => Promise<GenerateContentResult>,
    countTokensHandler?: (params: CountTokensParams) => Promise<number>
  ) {
    this.generateHandler = generateHandler;
    this.countTokensHandler = countTokensHandler;
  }

  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    this.calls.generate.push(params);
    if (this.generateHandler) {
      return this.generateHandler(params);
    }
    return {
      text: JSON.stringify({
        intentSummary: 'Test intent',
        taskCategory: 'General',
        detectedConstraints: {
          mustPreserve: ['core task'],
          outputFormat: null,
          lengthLimit: null,
          language: null,
          mustAvoid: [],
          exactLiterals: [],
        },
        highContext: `Role & Objective:\nExecute: ${params.contents}\nRequirements:\n- Maintain precision`,
        lowToken: params.contents.trim(),
        warnings: [],
        recommendation: {
          variant: 'lowToken',
          reason: 'Clean concise representation',
        },
      }),
      usage: {
        promptTokens: 40,
        candidateTokens: 60,
        totalTokens: 100,
      },
    };
  }

  async countTokens(params: CountTokensParams): Promise<number> {
    this.calls.count.push(params);
    if (this.countTokensHandler) {
      return this.countTokensHandler(params);
    }
    // Deterministic rough token count for fake service: ~4 chars per token, minimum 1 token for non-empty text
    if (!params.contents || params.contents.length === 0) return 0;
    const words = params.contents.trim().split(/\s+/).filter(Boolean);
    return Math.max(1, Math.round(words.length * 1.3));
  }
}
