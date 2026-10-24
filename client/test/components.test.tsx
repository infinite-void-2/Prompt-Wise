import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { App } from '../src/App.js';
import * as api from '../src/lib/api.js';

vi.mock('../src/lib/api.js', () => ({
  fetchHealth: vi.fn(),
  optimizePrompt: vi.fn(),
  executePrompt: vi.fn(),
  submitFeedback: vi.fn(),
}));

describe('Frontend Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchHealth).mockResolvedValue({
      status: 'ok',
      service: 'OptiPrompt API',
      model: 'gemini-2.5-flash',
      hasApiKey: true,
      historyEnabled: false,
      version: '1.0.0',
    });
  });

  // Test 1: Empty prompt disables Optimize button
  it('disables the Optimize button when prompt is empty or whitespace', () => {
    render(<App />);
    const optimizeBtn = screen.getByRole('button', { name: /Optimize Prompt/i });
    expect(optimizeBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Paste or write your raw prompt here/i);
    fireEvent.change(textarea, { target: { value: '    \n  ' } });
    expect(optimizeBtn).toBeDisabled();
  });

  // Test 2: Valid prompt triggers loading state and then renders 3 comparison columns
  it('enables Optimize on valid input, triggers loading state, and renders comparison columns', async () => {
    vi.mocked(api.optimizePrompt).mockResolvedValue({
      requestId: 'test-req-1',
      model: 'gemini-2.5-flash',
      intentSummary: 'Extract name and age',
      taskCategory: 'Data Extraction',
      detectedConstraints: {
        mustPreserve: ['name', 'age'],
        outputFormat: 'JSON',
        lengthLimit: null,
        language: 'en',
        mustAvoid: ['Markdown'],
        exactLiterals: ['name', 'age'],
      },
      rawPrompt: 'Extract name and age as valid JSON with keys name and age',
      highContext: 'Objective: Extract name and age\nConstraints:\n- Format: JSON',
      lowToken: 'Extract name and age. Return valid JSON only.',
      warnings: [],
      recommendation: {
        variant: 'lowToken',
        reason: 'Optimal brevity while preserving JSON format',
      },
      metrics: {
        rawTokens: 40,
        highContextTokens: 60,
        lowTokenTokens: 25,
        highContextChangePercent: 50.0,
        lowTokenReductionPercent: 37.5,
        measuredWith: 'Gemini Native API (gemini-2.5-flash)',
        costEstimate: {
          inputCost: 0.000003,
          currency: 'USD',
          isEstimate: true,
          assumptions: ['Input rate only'],
        },
      },
    });

    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste or write your raw prompt here/i);
    fireEvent.change(textarea, { target: { value: 'Extract name and age as valid JSON with keys name and age' } });

    const optimizeBtn = screen.getByRole('button', { name: /Optimize Prompt/i });
    expect(optimizeBtn).not.toBeDisabled();

    fireEvent.click(optimizeBtn);

    // Verify all 3 column headings render
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Original Prompt' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'High-Context Variant' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Low-Token Variant' })).toBeInTheDocument();
    });

    // Check token analytics percentage is shown
    expect(screen.getByText(/-37.5% tokens/i)).toBeInTheDocument();
  });

  // Test 3: Token metrics render correctly even when values are null
  it('renders token metrics and warnings gracefully when counts are null', async () => {
    vi.mocked(api.optimizePrompt).mockResolvedValue({
      requestId: 'test-req-null',
      model: 'gemini-2.5-flash',
      intentSummary: 'Token count failed gracefully',
      taskCategory: 'Writing',
      detectedConstraints: {
        mustPreserve: [],
        outputFormat: null,
        lengthLimit: null,
        language: null,
        mustAvoid: [],
        exactLiterals: [],
      },
      rawPrompt: 'Some test prompt',
      highContext: 'High-context prompt',
      lowToken: 'Low-token prompt',
      warnings: [
        {
          code: 'TOKEN_COUNT_RAW_FAILED',
          message: 'Could not count tokens for original prompt via Gemini API.',
        },
      ],
      recommendation: {
        variant: 'highContext',
        reason: 'Fallback selection',
      },
      metrics: {
        rawTokens: null,
        highContextTokens: null,
        lowTokenTokens: null,
        highContextChangePercent: null,
        lowTokenReductionPercent: null,
        measuredWith: 'Gemini Native API (gemini-2.5-flash)',
        costEstimate: null,
      },
    });

    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste or write your raw prompt here/i);
    fireEvent.change(textarea, { target: { value: 'Some test prompt' } });

    const optimizeBtn = screen.getByRole('button', { name: /Optimize Prompt/i });
    fireEvent.click(optimizeBtn);

    await waitFor(() => {
      expect(screen.getByText(/TOKEN_COUNT_RAW_FAILED/i)).toBeInTheDocument();
    });
  });

  // Test 4: User can edit a generated variant and the UI marks it as "Edited"
  it('marks a variant as Edited when user edits it and allows reset', async () => {
    vi.mocked(api.optimizePrompt).mockResolvedValue({
      requestId: 'test-req-edit',
      model: 'gemini-2.5-flash',
      intentSummary: 'Test edit flow',
      taskCategory: 'Coding',
      detectedConstraints: {
        mustPreserve: [],
        outputFormat: null,
        lengthLimit: null,
        language: null,
        mustAvoid: [],
        exactLiterals: [],
      },
      rawPrompt: 'Initial raw prompt',
      highContext: 'Initial high context prompt',
      lowToken: 'Initial low token prompt',
      warnings: [],
      recommendation: { variant: 'lowToken', reason: 'Concise' },
      metrics: {
        rawTokens: 10,
        highContextTokens: 20,
        lowTokenTokens: 8,
        highContextChangePercent: 100,
        lowTokenReductionPercent: 20,
        measuredWith: 'Gemini Native API',
        costEstimate: null,
      },
    });

    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste or write your raw prompt here/i);
    fireEvent.change(textarea, { target: { value: 'Initial raw prompt' } });
    fireEvent.click(screen.getByRole('button', { name: /Optimize Prompt/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Low-Token Variant' })).toBeInTheDocument();
    });

    // Locate the Low-Token textarea
    const lowTokenTextarea = screen.getByDisplayValue('Initial low token prompt');
    fireEvent.change(lowTokenTextarea, { target: { value: 'Initial low token prompt WITH CUSTOM EDITS' } });

    // Assert "Edited" badge is shown
    expect(screen.getByText('Edited')).toBeInTheDocument();

    // Click Reset
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(screen.queryByText('Edited')).not.toBeInTheDocument();
    expect(lowTokenTextarea).toHaveValue('Initial low token prompt');
  });

  // Test 5: Execute submits the exact edited text and displays the response
  it('submits the exact edited text to execute and displays the final response and usage metadata', async () => {
    vi.mocked(api.optimizePrompt).mockResolvedValue({
      requestId: 'test-req-exec',
      model: 'gemini-2.5-flash',
      intentSummary: 'Execution test',
      taskCategory: 'Coding',
      detectedConstraints: { mustPreserve: [], outputFormat: null, lengthLimit: null, language: null, mustAvoid: [], exactLiterals: [] },
      rawPrompt: 'Write python function',
      highContext: 'High-context python prompt',
      lowToken: 'Write python function.',
      warnings: [],
      recommendation: { variant: 'lowToken', reason: 'Concise' },
      metrics: {
        rawTokens: 10,
        highContextTokens: 20,
        lowTokenTokens: 8,
        highContextChangePercent: 100,
        lowTokenReductionPercent: 20,
        measuredWith: 'Gemini Native API',
        costEstimate: null,
      },
    });

    vi.mocked(api.executePrompt).mockResolvedValue({
      requestId: 'exec-123',
      prompt: 'Write python function. USER EDITED',
      response: 'def hello_world(): return "hello"',
      model: 'gemini-2.5-flash',
      latencyMs: 320,
      usage: { promptTokens: 15, candidateTokens: 25, totalTokens: 40 },
      timestamp: new Date().toISOString(),
    });

    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste or write your raw prompt here/i);
    fireEvent.change(textarea, { target: { value: 'Write python function' } });
    fireEvent.click(screen.getByRole('button', { name: /Optimize Prompt/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Low-Token Variant' })).toBeInTheDocument();
    });

    // Edit the low-token variant
    const lowTokenTextarea = screen.getByDisplayValue('Write python function.');
    fireEvent.change(lowTokenTextarea, { target: { value: 'Write python function. USER EDITED' } });

    // Execute low token variant using execute button
    const executeLowBtn = document.getElementById('execute-btn-low-token');
    expect(executeLowBtn).toBeInTheDocument();
    if (executeLowBtn) {
      fireEvent.click(executeLowBtn);
    }

    await waitFor(() => {
      expect(api.executePrompt).toHaveBeenCalledWith({
        prompt: 'Write python function. USER EDITED',
        variantType: 'lowToken',
      });
      expect(screen.getByText('def hello_world(): return "hello"')).toBeInTheDocument();
      expect(screen.getByText('320 ms')).toBeInTheDocument();
    });
  });

  // Test 6: Copy action copies text to clipboard
  it('copies the visible prompt text to clipboard', async () => {
    vi.mocked(api.optimizePrompt).mockResolvedValue({
      requestId: 'test-req-copy',
      model: 'gemini-2.5-flash',
      intentSummary: 'Copy test',
      taskCategory: 'Coding',
      detectedConstraints: { mustPreserve: [], outputFormat: null, lengthLimit: null, language: null, mustAvoid: [], exactLiterals: [] },
      rawPrompt: 'Original text to copy',
      highContext: 'High-context text to copy',
      lowToken: 'Low-token text to copy',
      warnings: [],
      recommendation: { variant: 'lowToken', reason: 'Concise' },
      metrics: { rawTokens: 5, highContextTokens: 10, lowTokenTokens: 4, highContextChangePercent: 100, lowTokenReductionPercent: 20, measuredWith: 'Gemini', costEstimate: null },
    });

    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste or write your raw prompt here/i);
    fireEvent.change(textarea, { target: { value: 'Original text to copy' } });
    fireEvent.click(screen.getByRole('button', { name: /Optimize Prompt/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Low-Token Variant' })).toBeInTheDocument();
    });

    const copyBtnOriginal = document.getElementById('copy-btn-original');
    expect(copyBtnOriginal).toBeInTheDocument();
    if (copyBtnOriginal) {
      fireEvent.click(copyBtnOriginal);
    }

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Original text to copy');
  });

  // Test 7: Error state preserves original user input
  it('preserves the user prompt in the textarea when optimization fails', async () => {
    vi.mocked(api.optimizePrompt).mockRejectedValue(new Error('Network connection timeout'));

    render(<App />);
    const textarea = screen.getByPlaceholderText(/Paste or write your raw prompt here/i);
    fireEvent.change(textarea, { target: { value: 'My important un-lost prompt' } });

    fireEvent.click(screen.getByRole('button', { name: /Optimize Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network connection timeout/i)).toBeInTheDocument();
    });

    // Ensure prompt was not wiped
    expect(textarea).toHaveValue('My important un-lost prompt');
  });

  // Test 8: Configurable app name
  it('allows user to rename application and updates header', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('OptiPrompt');

    const renameBtn = document.getElementById('rename-app-btn');
    if (renameBtn) {
      fireEvent.click(renameBtn);
      const input = screen.getByDisplayValue('OptiPrompt');
      fireEvent.change(input, { target: { value: 'PromptShield' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PromptShield');
    }
  });
});
