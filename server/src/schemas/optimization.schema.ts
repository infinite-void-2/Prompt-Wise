import { z } from 'zod';
import { config } from '../config/env.js';

export const TaskCategoryEnum = z.enum([
  'Auto',
  'Coding',
  'Writing',
  'Summarization',
  'Data Extraction',
  'Reasoning',
  'Creative',
  'Other',
]);

export type TaskCategory = z.infer<typeof TaskCategoryEnum>;

export const OptimizationRequestSchema = z.object({
  rawPrompt: z
    .string({ required_error: 'rawPrompt is required' })
    .trim()
    .min(1, { message: 'Prompt cannot be empty or whitespace-only' })
    .max(config.MAX_PROMPT_CHARS, {
      message: `Prompt exceeds maximum allowed length of ${config.MAX_PROMPT_CHARS} characters`,
    }),
  taskCategory: TaskCategoryEnum.optional().default('Auto'),
  model: z.string().optional(),
});

export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;

export const DetectedConstraintsSchema = z.object({
  mustPreserve: z.array(z.string()).default([]),
  outputFormat: z.string().nullable().default(null),
  lengthLimit: z.string().nullable().default(null),
  language: z.string().nullable().default(null),
  mustAvoid: z.array(z.string()).default([]),
  exactLiterals: z.array(z.string()).default([]),
});

export type DetectedConstraints = z.infer<typeof DetectedConstraintsSchema>;

export const OptimizationWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type OptimizationWarning = z.infer<typeof OptimizationWarningSchema>;

export const RecommendationSchema = z.object({
  variant: z.enum(['highContext', 'lowToken', 'original']),
  reason: z.string(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const CostEstimateSchema = z.object({
  inputCost: z.number().nullable(),
  currency: z.string(),
  isEstimate: z.literal(true),
  assumptions: z.array(z.string()),
});

export type CostEstimate = z.infer<typeof CostEstimateSchema>;

export const MetricsSchema = z.object({
  rawTokens: z.number().nullable(),
  highContextTokens: z.number().nullable(),
  lowTokenTokens: z.number().nullable(),
  highContextChangePercent: z.number().nullable(),
  lowTokenReductionPercent: z.number().nullable(),
  measuredWith: z.string(),
  costEstimate: CostEstimateSchema.nullable(),
});

export type Metrics = z.infer<typeof MetricsSchema>;

export const OptimizationResultSchema = z.object({
  requestId: z.string(),
  model: z.string(),
  intentSummary: z.string(),
  taskCategory: z.string(),
  detectedConstraints: DetectedConstraintsSchema,
  rawPrompt: z.string(),
  highContext: z.string(),
  lowToken: z.string(),
  warnings: z.array(OptimizationWarningSchema),
  recommendation: RecommendationSchema,
  metrics: MetricsSchema,
});

export type OptimizationResult = z.infer<typeof OptimizationResultSchema>;

// Raw LLM output schema expected from the structured Gemini call
export const GeminiOptimizationOutputSchema = z.object({
  intentSummary: z.string().default(''),
  taskCategory: z.string().default('General'),
  detectedConstraints: DetectedConstraintsSchema.default({
    mustPreserve: [],
    outputFormat: null,
    lengthLimit: null,
    language: null,
    mustAvoid: [],
    exactLiterals: [],
  }),
  highContext: z.string({ required_error: 'High-context variant is required' }),
  lowToken: z.string({ required_error: 'Low-token variant is required' }),
  warnings: z.array(OptimizationWarningSchema).default([]),
  recommendation: RecommendationSchema.default({
    variant: 'lowToken',
    reason: 'Preserves essential requirements with improved efficiency.',
  }),
});

export type GeminiOptimizationOutput = z.infer<typeof GeminiOptimizationOutputSchema>;
