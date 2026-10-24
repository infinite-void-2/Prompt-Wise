import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  console.log(`[OptiPrompt Server] Running on http://localhost:${config.PORT}`);
  console.log(`[OptiPrompt Server] Configured Default Model: ${config.DEFAULT_MODEL || config.GEMINI_MODEL}`);
  console.log(`[OptiPrompt Server] NVIDIA Nemotron API Key Configured: ${Boolean(config.NVIDIA_API_KEY)}`);
  console.log(`[OptiPrompt Server] Gemini API Key Configured: ${Boolean(config.GEMINI_API_KEY)}`);
  console.log(`[OptiPrompt Server] History Persistence: ${config.ENABLE_PROMPT_HISTORY ? 'Enabled' : 'Disabled (No-DB MVP)'}`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  console.log(`[OptiPrompt Server] Received ${signal}, gracefully shutting down...`);
  server.close(() => {
    console.log('[OptiPrompt Server] HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10 seconds if still hanging
  setTimeout(() => {
    console.error('[OptiPrompt Server] Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
