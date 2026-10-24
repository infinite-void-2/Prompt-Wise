import { z } from 'zod';
import { VariantTypeEnum } from './execution.schema.js';

export const FeedbackRequestSchema = z.object({
  requestId: z.string().min(1, 'requestId is required'),
  variantType: VariantTypeEnum,
  rating: z.enum(['helpful', 'not_helpful']),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  timestamp: z.string().optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

export const FeedbackResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  saved: z.boolean(),
});

export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;
