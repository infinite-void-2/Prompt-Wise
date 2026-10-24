import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { createApp } from '../../src/app.js';
import { FakeGeminiService } from '../../src/services/gemini.service.js';
import { OptimizerService } from '../../src/services/optimizer.service.js';

describe('Stage Timing Telemetry & Server-Timing Headers', () => {
  it('returns high-resolution stage timings in OptimizationResult', async () => {
    const fakeGemini = new FakeGeminiService();
    const optimizer = new OptimizerService(fakeGemini);

    const result = await optimizer.optimize({
      rawPrompt: 'Write a bash script to backup mysql database',
      requestId: 'timing-test',
    });

    expect(result.timings).toBeDefined();
    expect(result.timings?.totalMs).toBeGreaterThan(0);
    expect(result.timings?.analysisAndGenerationMs).toBeGreaterThanOrEqual(0);
    expect(result.timings?.tokenCountingMs).toBeGreaterThanOrEqual(0);
    expect(result.timings?.verificationMs).toBeGreaterThanOrEqual(0);
  });

  it('exposes Server-Timing header via Express route', async () => {
    const fakeGemini = new FakeGeminiService();
    const optimizer = new OptimizerService(fakeGemini);
    const app = createApp({
      geminiService: fakeGemini,
      optimizerService: optimizer,
      enableRateLimit: false,
    });

    const res = await supertest(app)
      .post('/api/optimize')
      .send({ rawPrompt: 'Summarize the financial quarterly report' })
      .expect(200);

    const serverTiming = res.headers['server-timing'];
    expect(serverTiming).toBeDefined();
    expect(serverTiming).toContain('total;dur=');
    expect(serverTiming).toContain('gen;dur=');
    expect(serverTiming).toContain('tok;dur=');
    expect(serverTiming).toContain('verif;dur=');
  });
});
