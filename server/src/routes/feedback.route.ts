import { NextFunction, Request, Response, Router } from 'express';
import { config } from '../config/env.js';
import { FeedbackRequest, FeedbackRequestSchema } from '../schemas/feedback.schema.js';

// In-memory feedback store for evaluation / analytics only
export const feedbackStore: FeedbackRequest[] = [];

export function createFeedbackRouter(): Router {
  const router = Router();

  router.post('/feedback', (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = FeedbackRequestSchema.parse(req.body);
      const feedbackRecord = {
        ...parsed,
        timestamp: parsed.timestamp || new Date().toISOString(),
      };

      feedbackStore.push(feedbackRecord);

      res.json({
        success: true,
        message: 'Feedback received for quality evaluation. Note: Feedback does not alter model parameters.',
        saved: true,
        historyEnabled: config.ENABLE_PROMPT_HISTORY,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
