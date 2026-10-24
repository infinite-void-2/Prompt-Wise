import { NextFunction, Request, Response, Router } from 'express';
import { OptimizationRequestSchema } from '../schemas/optimization.schema.js';
import { OptimizerService } from '../services/optimizer.service.js';

export function createOptimizeRouter(optimizerService: OptimizerService): Router {
  const router = Router();

  router.post('/optimize', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = OptimizationRequestSchema.parse(req.body);
      const requestId = req.id || 'req_' + Date.now();

      const result = await optimizerService.optimize({
        rawPrompt: parsed.rawPrompt,
        taskCategory: parsed.taskCategory,
        model: parsed.model,
        requestId,
      });

      if (result.timings) {
        res.setHeader(
          'Server-Timing',
          `total;dur=${result.timings.totalMs}, gen;dur=${result.timings.analysisAndGenerationMs}, tok;dur=${result.timings.tokenCountingMs}, verif;dur=${result.timings.verificationMs}`
        );
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
