import { NextFunction, Request, Response, Router } from 'express';
import { ExecutionRequestSchema } from '../schemas/execution.schema.js';
import { ExecutorService } from '../services/executor.service.js';

export function createExecuteRouter(executorService: ExecutorService): Router {
  const router = Router();

  router.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = ExecutionRequestSchema.parse(req.body);
      const requestId = req.id || 'exec_' + Date.now();

      const result = await executorService.execute(parsed, requestId);

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
