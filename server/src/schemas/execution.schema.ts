import { z } from 'zod';
import { config } from '../config/env.js';

export const VariantTypeEnum = z.enum(['original', 'highContext', 'lowToken', 'custom']);
export type VariantType = z.infer<typeof VariantTypeEnum>;

export const ExecutionRequestSchema = z.object({
  prompt: z
    .string({ required_error: 'prompt is required' })
    .trim()
    .min(1, { message: 'Prompt cannot be empty or whitespace-only' })
    .max(config.MAX_PROMPT_CHARS, {
      message: `Prompt exceeds maximum allowed length of ${config.MAX_PROMPT_CHARS} characters`,
    }),
  model: z.string().optional(),
  variantType: VariantTypeEnum.optional().default('custom'),
});

export type ExecutionRequest = z.infer<typeof ExecutionRequestSchema>;

export const ExecutionUsageSchema = z.object({
  promptTokens: z.number().nullable().default(null),
  candidateTokens: z.number().nullable().default(null),
  totalTokens: z.number().nullable().default(null),
});

export type ExecutionUsage = z.infer<typeof ExecutionUsageSchema>;

export const ExecutionResultSchema = z.object({
  requestId: z.string(),
  prompt: z.string(),
  response: z.string(),
  model: z.string(),
  latencyMs: z.number(),
  usage: ExecutionUsageSchema.nullable(),
  timestamp: z.string(),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;
