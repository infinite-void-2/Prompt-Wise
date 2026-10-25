import cors from 'cors';
import express, { Express } from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { createExecuteRouter } from './routes/execute.route.js';
import { createFeedbackRouter } from './routes/feedback.route.js';
import { createHealthRouter } from './routes/health.route.js';
import { createOptimizeRouter } from './routes/optimize.route.js';
import { ExecutorService } from './services/executor.service.js';
import { GeminiService, IGeminiService } from './services/gemini.service.js';
import { OptimizerService } from './services/optimizer.service.js';

import { NemotronService } from './services/nemotron.service.js';
import { UnifiedLLMService } from './services/unified-llm.service.js';

export interface AppDependencies {
  geminiService?: IGeminiService;
  optimizerService?: OptimizerService;
  executorService?: ExecutorService;
  enableRateLimit?: boolean;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();

  const llmService =
    deps.geminiService ||
    new UnifiedLLMService(new GeminiService(), new NemotronService());
  const optimizer = deps.optimizerService || new OptimizerService(llmService);
  const executor = deps.executorService || new ExecutorService(llmService);

  // Security & standard headers
  app.disable('x-powered-by');

  // CORS with dynamic origin validation
  const isAllowedOrigin = (origin?: string): boolean => {
    if (!origin) return true; // Server-to-server, curl, or same-origin
    if (origin === config.CLIENT_ORIGIN) return true;
    if (
      origin === 'http://localhost:5173' ||
      origin === 'http://127.0.0.1:5173' ||
      origin === 'http://localhost:3000' ||
      origin === 'http://localhost:4000'
    ) {
      return true;
    }
    // Allow any Vercel deployment (production, preview branch, custom subdomains)
    if (origin.endsWith('.vercel.app')) return true;

    // Allow additional custom origins defined in environment variables
    const additionalOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];
    if (additionalOrigins.includes(origin)) return true;

    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['Server-Timing', 'X-Request-Id'],
      credentials: true,
    })
  );

  // Body parser with size limit
  app.use(express.json({ limit: '1mb' }));

  // Tracing middleware
  app.use(requestIdMiddleware);

  // Rate Limiting (can be bypassed in unit tests if needed)
  if (deps.enableRateLimit !== false) {
    app.use('/api', apiRateLimiter);
  }

  // Mount API routes
  app.use('/api', createHealthRouter());
  app.use('/api', createOptimizeRouter(optimizer));
  app.use('/api', createExecuteRouter(executor));
  app.use('/api', createFeedbackRouter());

  // Error handling middleware
  app.use(errorHandler);

  return app;
}
