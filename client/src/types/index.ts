export type TaskCategory =
  | 'Auto'
  | 'Coding'
  | 'Writing'
  | 'Summarization'
  | 'Data Extraction'
  | 'Reasoning'
  | 'Creative'
  | 'Other';

export interface DetectedConstraints {
  mustPreserve: string[];
  outputFormat: string | null;
  lengthLimit: string | null;
  language: string | null;
  mustAvoid: string[];
  exactLiterals: string[];
}

export interface OptimizationWarning {
  code: string;
  message: string;
}

export interface Recommendation {
  variant: 'highContext' | 'lowToken' | 'original';
  reason: string;
}

export interface CostEstimate {
  inputCost: number | null;
  estimatedOutputTokens?: number | null;
  estimatedOutputCost?: number | null;
  totalCostPerCall?: number | null;
  costPer1kCalls?: number | null;
  currency: string;
  isEstimate: true;
  assumptions: string[];
}

export interface VerificationDetails {
  passed: boolean;
  mustPreserveSatisfied: string[];
  mustPreserveMissing: string[];
  exactLiteralsSatisfied: string[];
  exactLiteralsMissing: string[];
  negativeConstraintsViolated: string[];
  fallbackApplied: boolean;
}

export interface StageTimings {
  totalMs: number;
  analysisAndGenerationMs: number;
  tokenCountingMs: number;
  verificationMs: number;
}

export interface Metrics {
  rawTokens: number | null;
  highContextTokens: number | null;
  lowTokenTokens: number | null;
  highContextChangePercent: number | null;
  lowTokenReductionPercent: number | null;
  measuredWith: string;
  costEstimate: CostEstimate | null;
}

export interface OptimizationResult {
  requestId: string;
  model: string;
  intentSummary: string;
  taskCategory: string;
  detectedConstraints: DetectedConstraints;
  rawPrompt: string;
  highContext: string;
  lowToken: string;
  warnings: OptimizationWarning[];
  recommendation: Recommendation;
  metrics: Metrics;
  verificationStatus?: {
    highContext: VerificationDetails;
    lowToken: VerificationDetails;
  };
  timings?: StageTimings;
}

export interface ExecutionUsage {
  promptTokens: number | null;
  candidateTokens: number | null;
  totalTokens: number | null;
}

export interface ExecutionResult {
  requestId: string;
  prompt: string;
  response: string;
  model: string;
  latencyMs: number;
  usage: ExecutionUsage | null;
  timestamp: string;
}

export interface ServiceHealth {
  status: string;
  service: string;
  model: string;
  hasApiKey: boolean;
  historyEnabled: boolean;
  version: string;
}
