import { Request, Response, Router } from 'express';
import { config } from '../config/env.js';

export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'OptiPrompt API',
      model: config.GEMINI_MODEL,
      hasApiKey: Boolean(config.GEMINI_API_KEY && config.GEMINI_API_KEY.length > 5),
      historyEnabled: config.ENABLE_PROMPT_HISTORY,
      version: '1.0.0',
    });
  });

  return router;
}
