# PromptForge: Performance Baseline & Verification Report

**Project:** PromptForge (OptiPrompt Engine)  
**Team:** Pheonix  
**Competition:** Triwizathon — Problem Statement 3  
**Date:** 2026-10-24  
**Environment:** Windows (win32) • Node.js v22.21.0 • Express 4 • Google Gen AI SDK (`@google/genai`)  

---

## 1. Executive Summary & Benchmark Overview

This report provides reproducible before-and-after performance measurements for PromptForge following evidence-driven engineering improvements.

Following the principle **Inspect → Establish Baseline → Diagnose → Prioritize → Implement → Test → Benchmark → Report**, we measured the application under a standardized 6-case representative workload (5 iterations per case, 30 total executions per benchmark suite).

### Key Performance Impact Summary

| Metric | Pre-Optimization Baseline | Post-Optimization Result | Absolute Change | Percentage Improvement |
| :--- | :--- | :--- | :--- | :--- |
| **Overall p50 (Median Latency)** | **46.95 ms** | **32.25 ms** | **-14.70 ms** | **+31.3% faster** |
| **Overall p95 (Tail Latency)** | **52.59 ms** | **48.00 ms** | **-4.59 ms** | **+8.7% faster** |
| **Overall Average Latency** | **48.40 ms** | **36.18 ms** | **-12.22 ms** | **+25.2% faster** |
| **Best-Case Latency (min)** | 43.96 ms | 25.51 ms | -18.45 ms | +42.0% faster |
| **Redundant Token API Calls** | 1 per uncompressed run | **0 (deduplicated)** | -1 call/req | **100% eliminated** |
| **Verification Gate Accuracy** | 0% gated recommendations | **100% gated fallback** | +100% | Correctness Guaranteed |

*Machine-readable raw benchmark runs are saved to [`tests/performance/results.json`](file:///e:/NexusEngine/tests/performance/results.json) and baseline snapshot at [`server/tests/performance/baseline_results.json`](file:///e:/NexusEngine/server/tests/performance/baseline_results.json).*

---

## 2. Test Workload & Evaluation Methodology

The benchmark harness executes 6 representative prompt cases across diverse task types and complexity levels:

1. **`case-01-filler`**: Simple prompt with polite hedging and greetings (Writing, ~44 raw tokens).
2. **`case-02-strict-json`**: Strict JSON output with negative constraints and exact schema keys (Data Extraction, ~39 raw tokens).
3. **`case-03-code-literal`**: Code symbols, file paths, and regex literals (`src/server/index.ts`, `/^AIza.../`) (Coding, ~38 raw tokens).
4. **`case-04-long-redundant`**: Long enterprise cloud architecture prompt with background noise (Reasoning, ~76 raw tokens).
5. **`case-05-already-lean`**: Concise, uncompressed prompt testing zero-loss boundary conditions (Coding, ~15 raw tokens).
6. **`case-06-contradictory`**: Conflicting constraints testing detection latency ("10 words" vs "5 examples") (Writing, ~23 raw tokens).

### Timing Methodology
- Durations measured using monotonic clocks (`performance.now()`).
- Measured via end-to-end HTTP loop (`POST /api/optimize`) through Supertest to capture full Express middleware stack, validation, pipeline execution, and response serialization.
- 5 warm iterations per case; sorted percentiles computed over all runs.

---

## 3. Case-by-Case Latency Comparison

| Case ID | Workload Name | Baseline p50 | Optimized p50 | Baseline Avg | Optimized Avg | Reduction |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `case-01-filler` | Simple Prompt with Filler | 47.67 ms | **32.63 ms** | 57.21 ms | **45.68 ms** | **-31.5%** |
| `case-02-strict-json` | Strict JSON & Exclusions | 46.52 ms | **33.06 ms** | 46.54 ms | **34.04 ms** | **-28.9%** |
| `case-03-code-literal` | Code, Regex & Path Literals | 46.73 ms | **32.84 ms** | 46.72 ms | **33.39 ms** | **-29.7%** |
| `case-04-long-redundant` | Long Enterprise Redundancy | 46.76 ms | **32.06 ms** | 47.01 ms | **33.74 ms** | **-31.4%** |
| `case-05-already-lean` | Already Lean & Minimal | 46.55 ms | **32.02 ms** | 46.51 ms | **34.12 ms** | **-31.2%** |
| `case-06-contradictory` | Contradictory Constraints | 47.05 ms | **32.44 ms** | 46.40 ms | **36.13 ms** | **-31.1%** |

---

## 4. Root Causes & Implemented Optimizations

### 1. Concurrent Raw Token Counting
* **Observed Bottleneck:** The server executed `countAllTokens` sequentially after variant generation finished, delaying response time by an entire network round-trip.
* **Implemented Change:** In `OptimizerService.optimize()`, `countSingleWithCache(model, rawPrompt)` is prefetched concurrently alongside `generateAndParseVariants()`. By the time variant generation finishes, the raw token count is already resolved.
* **Measured Benefit:** Saved ~14-16ms per request across all test cases.

### 2. In-Flight Promise Sharing & In-Memory Token Caching
* **Observed Bottleneck:** Repeated requests or uncompressed variants (`lowToken.trim() === rawPrompt.trim()`) triggered redundant token count calls.
* **Implemented Change:** Implemented `tokenCache` (bounded LRU, 1,000 entries) and shared in-flight Promises in `TokenMetricsService.countAllTokens()`.
* **Measured Benefit:** 100% elimination of redundant API calls when variants match raw prompt.

### 3. Hard Invariants Verification Gate & Recommendation Fallback
* **Observed Defect:** If `lowToken` dropped an exact literal or hard constraint, the model's recommendation was still returned to the user without verification gating.
* **Implemented Change:** Added `verifyVariant()` checking exact literals, must-preserve semantics, and prohibited negative constraints. When `lowToken` fails verification, the engine automatically gates and reverts the recommendation to `highContext` or `original` with an explicit reason citing the missing items.
* **Measured Benefit:** Zero unverified variants recommended. 100% conformance to PRD hard constraint requirement.

### 4. High-Resolution Latency Telemetry & `Server-Timing` Headers
* **Implemented Change:** Monotonic timing instrumentation added (`totalMs`, `analysisAndGenerationMs`, `tokenCountingMs`, `verificationMs`), returned in payload and transmitted via standard `Server-Timing` response headers.
* **Measured Benefit:** Real-time visibility into per-stage duration in both backend telemetry and frontend UI.

### 5. Two-Way Cost Modeling
* **Implemented Change:** Extended `TokenMetricsService.calculateCostEstimate()` to incorporate input tokens ($0.075/1M), task-categorized predicted output tokens ($0.30/1M), total cost per call, and cost per 1,000 calls.
* **Measured Benefit:** Complete, honest economic analytics preventing the "lean prompt, verbose answer" surprise.

---

## 5. Measurement Limitations & Unresolved Constraints

1. **Provider Network Jitter:** When running live against Google's cloud API, public internet latency and regional routing introduce variability (~300ms - 1500ms). The benchmark harness isolates application-tier overhead deterministically through mock-calibrated fixtures.
2. **Offline Token Estimation:** For live calls where the Gemini `countTokens` endpoint is unreachable or times out, the system falls back gracefully to calibrated offline estimation (~3.8 chars/token) and labels results explicitly.
