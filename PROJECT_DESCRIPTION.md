# OptiPrompt (Prompt-Wise)

**OptiPrompt** is an intelligent prompt optimization and token-efficiency developer engine powered by Google Gen AI (`@google/genai`) and Gemini 2.5. It solves prompt bloat, ambiguous constraints, and uncalibrated API costs through an automated, meaning-preserving optimization pipeline.

---

## What It Does

When given a raw user prompt, OptiPrompt performs structural intent analysis, constraint extraction, and generates two distinct, production-ready variants side-by-side:

1. **High-Context Variant**: Enriches the prompt with clear structural sections (*Objective*, *Context*, *Constraints*, *Output Format*, and *Success Criteria*) without hallucinating unmentioned facts or third-party dependencies. Ideal for high-precision, complex reasoning tasks.
2. **Low-Token Variant**: Strips polite filler, conversational fluff, and redundancy while strictly guaranteeing 100% retention of atomic requirements, schema keys, negative constraints, and exact literals. Ideal for high-throughput, cost-sensitive production pipelines.

---

## Key Features

- **Side-by-Side 3-Column Comparison**: Direct visual breakdown between Raw, High-Context, and Low-Token prompts with inline editing and copy actions.
- **Native Gemini Token Counting**: Real-time token measurements using Google's native `models.countTokens` API with cost estimation and percentage delta breakdowns.
- **Verification & Invariant Guardrails**: Automated checks ensuring that critical literals, negative constraints ("do not use..."), and output format rules are preserved.
- **In-App Prompt Execution**: Execute the approved or edited prompt directly against Gemini models to verify actual output quality, token usage, and latency.
- **Golden Evaluation & Benchmark Suite**: Includes 20 offline golden test prompts and reproducible performance benchmark scripts to ensure deterministic optimization quality.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (v20+ / v22+), Express, TypeScript, Zod schema validation.
- **AI / SDK**: `@google/genai` (Official Google Gen AI SDK) with Gemini 2.5 Flash.
- **Testing**: Vitest, React Testing Library, Supertest (deterministic offline suite).

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Add GEMINI_API_KEY in .env

# 3. Start development servers (frontend on :5173, backend on :4000)
npm run dev
```
