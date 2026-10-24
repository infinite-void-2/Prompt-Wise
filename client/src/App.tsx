import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Sparkles, Zap, Shield } from 'lucide-react';
import { ConstraintBadges } from './components/ConstraintBadges.js';
import { ExecutionOutputPanel } from './components/ExecutionOutputPanel.js';
import { Header } from './components/Header.js';
import { PromptInputPanel } from './components/PromptInputPanel.js';
import { TokenComparisonBar } from './components/TokenComparisonBar.js';
import { VariantColumn } from './components/VariantColumn.js';
import { WarningsBanner } from './components/WarningsBanner.js';
import { executePrompt, fetchHealth, optimizePrompt } from './lib/api.js';
import {
  ExecutionResult,
  OptimizationResult,
  ServiceHealth,
  TaskCategory,
} from './types/index.js';

export const App: React.FC = () => {
  // App branding (configurable in UI)
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('optiprompt_app_name') || 'OptiPrompt';
  });

  const handleUpdateAppName = (name: string) => {
    setAppName(name);
    localStorage.setItem('optiprompt_app_name', name);
  };

  // Service Health
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Prompt input state
  const [rawPrompt, setRawPrompt] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Auto');

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable text state for the 3 variants
  const [originalText, setOriginalText] = useState('');
  const [highContextText, setHighContextText] = useState('');
  const [lowTokenText, setLowTokenText] = useState('');

  // Stale request tracking (FR-6 / UX)
  const latestRequestIdRef = useRef<number>(0);

  // Execution state (Phase 2)
  const [isExecuting, setIsExecuting] = useState(false);
  const [executedVariant, setExecutedVariant] = useState<
    'original' | 'highContext' | 'lowToken' | 'custom'
  >('lowToken');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const executionRef = useRef<HTMLDivElement>(null);

  // Fetch health status on mount
  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((data) => {
        if (active) setHealth(data);
      })
      .catch(() => {
        if (active) setHealth(null);
      })
      .finally(() => {
        if (active) setHealthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Phase 1: Optimize Prompt
  const handleOptimize = async () => {
    if (!rawPrompt.trim() || isOptimizing) return;

    setErrorMessage(null);
    setIsOptimizing(true);
    const reqTimestamp = Date.now();
    latestRequestIdRef.current = reqTimestamp;

    // Real progress steps
    setProgressStep('Analyzing intent & constraints...');
    const t1 = setTimeout(() => {
      if (latestRequestIdRef.current === reqTimestamp) {
        setProgressStep('Generating High-Context & Low-Token variants...');
      }
    }, 600);

    const t2 = setTimeout(() => {
      if (latestRequestIdRef.current === reqTimestamp) {
        setProgressStep('Counting tokens via Gemini Native API...');
      }
    }, 1200);

    try {
      const result = await optimizePrompt({
        rawPrompt,
        taskCategory: category,
      });

      // Avoid stale response overwriting
      if (latestRequestIdRef.current !== reqTimestamp) return;

      setOptimizationResult(result);
      setOriginalText(result.rawPrompt);
      setHighContextText(result.highContext);
      setLowTokenText(result.lowToken);
    } catch (err: any) {
      if (latestRequestIdRef.current === reqTimestamp) {
        setErrorMessage(err.message || 'Failed to optimize prompt. Please check your connection.');
      }
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      if (latestRequestIdRef.current === reqTimestamp) {
        setIsOptimizing(false);
        setProgressStep(null);
      }
    }
  };

  // Phase 2: Execute Selected Variant
  const handleExecute = async (
    textToExecute: string,
    variantType: 'original' | 'highContext' | 'lowToken'
  ) => {
    if (!textToExecute.trim() || isExecuting) return;

    setErrorMessage(null);
    setIsExecuting(true);
    setExecutedVariant(variantType);

    try {
      const result = await executePrompt({
        prompt: textToExecute,
        variantType,
      });

      setExecutionResult(result);

      // Smooth scroll to execution results
      setTimeout(() => {
        executionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setErrorMessage(
        `Execution failed: ${err.message || 'The model encountered an error executing your prompt.'}`
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <Header
        appName={appName}
        onUpdateAppName={handleUpdateAppName}
        health={health}
        healthLoading={healthLoading}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Value Proposition Hero */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Two-Phase Pipeline: Optimize & Compare, then Execute</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Transform Raw Prompts into High-Precision & Token-Efficient Variants
          </h2>
          <p className="text-sm text-slate-400">
            Compare Gemini-native token counts before executing. Never sacrifice core constraints or literal identifiers for arbitrary compression.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            id="error-banner"
            className="flex items-start space-x-3 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs animate-shake"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Error</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Input Panel */}
        <section aria-label="Prompt Input">
          <PromptInputPanel
            rawPrompt={rawPrompt}
            onPromptChange={setRawPrompt}
            category={category}
            onCategoryChange={setCategory}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            progressStep={progressStep}
          />
        </section>

        {/* Optimization Results Section */}
        {optimizationResult && (
          <section
            id="optimization-results-section"
            className="space-y-6 pt-4 animate-fadeIn"
            aria-label="Comparison and Analytics"
          >
            {/* Warnings (if any) */}
            <WarningsBanner warnings={optimizationResult.warnings} />

            {/* Recommendation Card */}
            {optimizationResult.recommendation && (
              <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20 flex items-start space-x-3 shadow-lg">
                <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      Engine Recommendation:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                      {optimizationResult.recommendation.variant === 'highContext'
                        ? 'High-Context Variant'
                        : optimizationResult.recommendation.variant === 'lowToken'
                        ? 'Low-Token Variant'
                        : 'Original Prompt'}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {optimizationResult.recommendation.reason}
                  </p>
                </div>
              </div>
            )}

            {/* Token Analytics Bar */}
            <TokenComparisonBar metrics={optimizationResult.metrics} />

            {/* Detected Invariants and Constraints */}
            <ConstraintBadges
              constraints={optimizationResult.detectedConstraints}
              intentSummary={optimizationResult.intentSummary}
            />

            {/* 3-Column Side-by-Side Comparison */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Side-by-Side Prompt Comparison</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Select a variant to edit or execute directly
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. Original Prompt Column */}
                <VariantColumn
                  id="original"
                  title="Original Prompt"
                  subtitle="Raw prompt submitted by user"
                  variantType="original"
                  initialText={optimizationResult.rawPrompt}
                  currentText={originalText}
                  onTextChange={setOriginalText}
                  tokenCount={optimizationResult.metrics.rawTokens}
                  deltaPercent={null}
                  isRecommended={optimizationResult.recommendation.variant === 'original'}
                  onExecute={() => handleExecute(originalText, 'original')}
                  isExecuting={isExecuting}
                  accentColor="slate"
                />

                {/* 2. High-Context Variant Column */}
                <VariantColumn
                  id="high-context"
                  title="High-Context Variant"
                  subtitle="Added structure, role, constraints & output criteria"
                  variantType="highContext"
                  initialText={optimizationResult.highContext}
                  currentText={highContextText}
                  onTextChange={setHighContextText}
                  tokenCount={optimizationResult.metrics.highContextTokens}
                  deltaPercent={optimizationResult.metrics.highContextChangePercent}
                  isRecommended={optimizationResult.recommendation.variant === 'highContext'}
                  onExecute={() => handleExecute(highContextText, 'highContext')}
                  isExecuting={isExecuting}
                  accentColor="sky"
                />

                {/* 3. Low-Token Variant Column */}
                <VariantColumn
                  id="low-token"
                  title="Low-Token Variant"
                  subtitle="Lean imperative phrasing, 100% constraint preservation"
                  variantType="lowToken"
                  initialText={optimizationResult.lowToken}
                  currentText={lowTokenText}
                  onTextChange={setLowTokenText}
                  tokenCount={optimizationResult.metrics.lowTokenTokens}
                  deltaPercent={optimizationResult.metrics.lowTokenReductionPercent}
                  isRecommended={optimizationResult.recommendation.variant === 'lowToken'}
                  onExecute={() => handleExecute(lowTokenText, 'lowToken')}
                  isExecuting={isExecuting}
                  accentColor="emerald"
                />
              </div>
            </div>
          </section>
        )}

        {/* Phase 2: Execution Result Panel */}
        {executionResult && (
          <div ref={executionRef} className="pt-4 animate-slideUp">
            <ExecutionOutputPanel
              result={executionResult}
              variantType={executedVariant}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 {appName}. Built with Google Gemini API native token counting.</p>
          <p className="text-[11px] text-slate-600">
            Meaning preservation beats token reduction • Evidence over fake precision
          </p>
        </div>
      </footer>
    </div>
  );
};
