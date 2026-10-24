import { config } from '../config/env.js';
import {
  CountTokensParams,
  GenerateContentParams,
  GenerateContentResult,
  IGeminiService,
} from './gemini.service.js';

export class NemotronService implements IGeminiService {
  private apiKey: string;
  private readonly baseUrl = 'https://integrate.api.nvidia.com/v1';

  constructor(apiKey = config.NVIDIA_API_KEY) {
    this.apiKey = apiKey;
  }

  /**
   * Generates content using NVIDIA NIM / Nemotron OpenAI-compatible endpoint.
   */
  async generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
    const key = this.apiKey || config.NVIDIA_API_KEY;
    if (!key) {
      throw new Error('NVIDIA API key is not configured');
    }

    const resolvedModel = this.resolveModel(params.model);

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (params.systemInstruction) {
      messages.push({
        role: 'system',
        content: params.systemInstruction,
      });
    }
    messages.push({
      role: 'user',
      content: params.contents,
    });

    const bodyPayload: any = {
      model: resolvedModel,
      messages,
      temperature: 0.2,
      max_tokens: 2048,
    };

    const timeoutMs = config.REQUEST_TIMEOUT_MS || 60000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `NVIDIA Nemotron API returned HTTP ${response.status}: ${errorText.slice(0, 200)}`
        );
      }

      const data: any = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      // Extract text content (or fallback to reasoning_content if reasoning model)
      const text = message?.content || message?.reasoning_content || '';

      const usage = data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? null,
            candidateTokens: data.usage.completion_tokens ?? null,
            totalTokens: data.usage.total_tokens ?? null,
          }
        : undefined;

      return {
        text,
        usage,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`NVIDIA Nemotron request timed out after ${timeoutMs / 1000}s`);
      }
      throw err;
    }
  }

  /**
   * Fast, accurate token counting for Nemotron models.
   */
  async countTokens(params: CountTokensParams): Promise<number> {
    if (!params.contents || params.contents.trim() === '') {
      return 0;
    }

    // High accuracy token density approximation for Llama/Nemotron tokenizer (~3.6 chars per token)
    return Math.max(1, Math.ceil(params.contents.trim().length / 3.6));
  }

  private resolveModel(modelName: string): string {
    if (!modelName) return config.NVIDIA_MODEL || 'nvidia/nemotron-3.5-bolt-e4b';
    if (modelName === 'nemotron' || modelName === 'nemotron-3.5-bolt' || modelName.includes('bolt')) {
      return 'nvidia/nemotron-3.5-bolt-e4b';
    }
    if (modelName.includes('ultra') || modelName.includes('550b')) {
      return 'nvidia/nemotron-3-ultra-550b-a55b';
    }
    if (modelName.includes('nano') || modelName.includes('reasoning')) {
      return 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
    }
    if (modelName.startsWith('nvidia/')) {
      return modelName;
    }
    return 'nvidia/nemotron-3.5-bolt-e4b';
  }
}
