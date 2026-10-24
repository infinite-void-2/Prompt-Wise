import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { feedbackStore } from '../../src/routes/feedback.route.js';
import {
  FakeGeminiService,
  GeminiConfigError,
  GeminiRateLimitError,
} from '../../src/services/gemini.service.js';

describe('OptiPrompt API Integration Tests', () => {
  // Case 18: Server health check does not expose API key or private secrets
  it('Case 18a: GET /api/health exposes status and model without revealing secrets', async () => {
    const app = createApp({ enableRateLimit: false });
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.model).toBeDefined();
    expect(res.body.apiKey).toBeUndefined();
    expect(res.body.GEMINI_API_KEY).toBeUndefined();
    expect(typeof res.body.hasApiKey).toBe('boolean');
  });

  // Case 1 & 2: Validation errors for whitespace and missing prompts
  it('Case 01 & 02: POST /api/optimize returns 400 VALIDATION_ERROR for empty/whitespace prompt', async () => {
    const app = createApp({ enableRateLimit: false });

    const resWhitespace = await request(app)
      .post('/api/optimize')
      .send({ rawPrompt: '   \n\t  ' });

    expect(resWhitespace.status).toBe(400);
    expect(resWhitespace.body.success).toBe(false);
    expect(resWhitespace.body.error.code).toBe('VALIDATION_ERROR');

    const resMissing = await request(app).post('/api/optimize').send({});
    expect(resMissing.status).toBe(400);
    expect(resMissing.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Case 3: Prompt exceeds configured maximum length
  it('Case 03: POST /api/optimize rejects prompt exceeding max length', async () => {
    const app = createApp({ enableRateLimit: false });
    const hugePrompt = 'x'.repeat(25000);

    const res = await request(app)
      .post('/api/optimize')
      .send({ rawPrompt: hugePrompt });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Happy path optimization with fake Gemini service
  it('POST /api/optimize succeeds with structured variants, metrics, and request ID', async () => {
    const fakeService = new FakeGeminiService(
      async () => ({
        text: JSON.stringify({
          intentSummary: 'Integrate weather API',
          taskCategory: 'Coding',
          detectedConstraints: {
            mustPreserve: ['OpenWeather', 'API key'],
            outputFormat: 'TypeScript',
            lengthLimit: null,
            language: 'en',
            mustAvoid: [],
            exactLiterals: ['OpenWeather'],
          },
          highContext: 'Role: Developer\nTask: Integrate OpenWeather API in TypeScript.',
          lowToken: 'Integrate OpenWeather API in TypeScript.',
          warnings: [],
          recommendation: {
            variant: 'lowToken',
            reason: 'Clean concise specification',
          },
        }),
      }),
      async (params) => params.contents.length
    );

    const app = createApp({ geminiService: fakeService, enableRateLimit: false });

    const res = await request(app)
      .post('/api/optimize')
      .send({ rawPrompt: 'Write a TypeScript script to fetch OpenWeather data using API key.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.highContext).toContain('OpenWeather');
    expect(res.body.data.lowToken).toContain('OpenWeather');
    expect(res.body.data.metrics.rawTokens).toBeGreaterThan(0);
    expect(res.header['x-request-id']).toBeDefined();
  });

  // Case 16: Provider 429 returns clean 429 status and message
  it('Case 16: returns HTTP 429 when Gemini quota is exceeded', async () => {
    const rateLimitedService = new FakeGeminiService(async () => {
      throw new GeminiRateLimitError();
    });

    const app = createApp({ geminiService: rateLimitedService, enableRateLimit: false });

    const res = await request(app)
      .post('/api/optimize')
      .send({ rawPrompt: 'Please summarize recursion' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  // Case 18b: Missing API key error
  it('Case 18b: returns HTTP 503 CONFIG_ERROR if Gemini credentials are not configured', async () => {
    const missingKeyService = new FakeGeminiService(async () => {
      throw new GeminiConfigError();
    });

    const app = createApp({ geminiService: missingKeyService, enableRateLimit: false });

    const res = await request(app)
      .post('/api/optimize')
      .send({ rawPrompt: 'Test prompt without key' });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('CONFIG_ERROR');
  });

  // Case 19: Execution integrity - executes EXACT text submitted by user, including edits
  it('Case 19: POST /api/execute passes exactly the user-approved edited prompt to the model', async () => {
    let promptDeliveredToModel = '';
    const fakeService = new FakeGeminiService(async (params) => {
      promptDeliveredToModel = params.contents;
      return {
        text: 'Generated execution output from Gemini',
        usage: { promptTokens: 30, candidateTokens: 50, totalTokens: 80 },
      };
    });

    const app = createApp({ geminiService: fakeService, enableRateLimit: false });

    const editedUserPrompt = 'USER EDITED VARIANT: Write python function with O(n) space.';
    const res = await request(app)
      .post('/api/execute')
      .send({
        prompt: editedUserPrompt,
        variantType: 'custom',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(promptDeliveredToModel).toBe(editedUserPrompt);
    expect(res.body.data.response).toBe('Generated execution output from Gemini');
    expect(res.body.data.usage.totalTokens).toBe(80);
    expect(res.body.data.latencyMs).toBeGreaterThanOrEqual(0);
  });

  // Case 20: Gemini API key privacy - never exposed in responses or headers
  it('Case 20: ensures no API secret is ever exposed in response payloads or headers', async () => {
    const SECRET_KEY = 'AIzaSySecretFakeKey1234567890';
    const fakeService = new FakeGeminiService(async () => {
      throw new Error(`Connection error with key ${SECRET_KEY}`);
    });

    const app = createApp({ geminiService: fakeService, enableRateLimit: false });

    const res = await request(app)
      .post('/api/optimize')
      .send({ rawPrompt: 'Check secret leakage' });

    const responseBodyStr = JSON.stringify(res.body);
    const headersStr = JSON.stringify(res.headers);

    expect(responseBodyStr).not.toContain(SECRET_KEY);
    expect(headersStr).not.toContain(SECRET_KEY);
  });

  // Case 24: No prompt persistence by default
  it('Case 24: does not persist raw prompts to any persistent database in default MVP mode', async () => {
    const app = createApp({ enableRateLimit: false });

    const res = await request(app).get('/api/health');
    expect(res.body.historyEnabled).toBe(false);
  });

  // Case 25: Feedback is not training - records evaluation metadata only
  it('Case 25: POST /api/feedback records evaluation metadata and confirms no model fine-tuning occurs', async () => {
    const app = createApp({ enableRateLimit: false });

    const initialCount = feedbackStore.length;
    const res = await request(app).post('/api/feedback').send({
      requestId: 'test_req_123',
      variantType: 'lowToken',
      rating: 'helpful',
      reason: 'Reduced tokens while preserving the required JSON format.',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Feedback does not alter model parameters');
    expect(feedbackStore.length).toBe(initialCount + 1);
  });
});
