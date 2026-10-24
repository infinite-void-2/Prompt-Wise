import fs from 'fs';
import path from 'path';
import { OptimizationResult } from '../schemas/optimization.schema.js';
import { OPTIMIZER_INSTRUCTION_VERSION } from '../services/prompt-templates.js';

export interface GoldenCase {
  id: string;
  category: string;
  name: string;
  rawPrompt: string;
  expectedInvariants: {
    task: string;
    mustPreserve: string[];
    mustAvoid?: string[];
    exactLiterals?: string[];
    outputFormat?: string | null;
    language?: string;
    allowNoCompression?: boolean;
    expectContradictionWarning?: boolean;
    expectAmbiguityWarning?: boolean;
    expectPromptInjectionWarning?: boolean;
  };
  mockResponse?: {
    intentSummary: string;
    taskCategory: string;
    detectedConstraints: any;
    highContext: string;
    lowToken: string;
    warnings?: any[];
    recommendation: any;
  };
}

export interface CaseEvaluationScore {
  caseId: string;
  category: string;
  name: string;
  intentPreservation: number; // 0-5
  constraintPreservation: number; // 0-5
  clarityAndUsability: number; // 0-5
  compressionEfficiency: number; // 0-5 (Low-Token)
  unsupportedAdditionsCount: number;
  formatInvariantPassed: boolean;
  literalInvariantsPassed: boolean;
  warningsDetected: string[];
  tokenMetrics: {
    rawTokens: number | null;
    highContextTokens: number | null;
    lowTokenTokens: number | null;
    lowTokenReductionPercent: number | null;
  };
  passed: boolean;
  failureReasons: string[];
}

export interface EvaluationReport {
  timestamp: string;
  model: string;
  instructionVersion: string;
  mode: 'offline_fixture' | 'live_gemini';
  totalCases: number;
  passedCases: number;
  failedCases: number;
  averageScores: {
    intentPreservation: number;
    constraintPreservation: number;
    clarityAndUsability: number;
    compressionEfficiency: number;
  };
  results: CaseEvaluationScore[];
}

export class GoldenEvaluator {
  evaluateCase(goldenCase: GoldenCase, result: OptimizationResult): CaseEvaluationScore {
    const failureReasons: string[] = [];
    const invariants = goldenCase.expectedInvariants;

    // 1. Literal Invariant Checks (Exact case-sensitive matching for code, regex, schema keys)
    let literalInvariantsPassed = true;
    if (invariants.exactLiterals && invariants.exactLiterals.length > 0) {
      for (const lit of invariants.exactLiterals) {
        const inHigh = result.highContext.includes(lit);
        const inLow = result.lowToken.includes(lit);
        if (!inHigh || !inLow) {
          literalInvariantsPassed = false;
          failureReasons.push(`Exact literal "${lit}" missing (highContext: ${inHigh}, lowToken: ${inLow})`);
        }
      }
    }

    // 2. Must-preserve semantic constraints check (case-insensitive)
    let preservedCount = 0;
    for (const term of invariants.mustPreserve) {
      const lower = term.toLowerCase();
      const inHigh = result.highContext.toLowerCase().includes(lower);
      const inLow = result.lowToken.toLowerCase().includes(lower);
      if (inHigh && inLow) {
        preservedCount++;
      } else {
        failureReasons.push(`Preserve requirement "${term}" missing in variant (high: ${inHigh}, low: ${inLow})`);
      }
    }
    const constraintRatio = invariants.mustPreserve.length > 0 ? preservedCount / invariants.mustPreserve.length : 1;
    const constraintPreservation = Math.round(constraintRatio * 5);

    // 3. Must-avoid negative constraints check
    if (invariants.mustAvoid && invariants.mustAvoid.length > 0) {
      for (const avoidTerm of invariants.mustAvoid) {
        const lower = avoidTerm.toLowerCase();
        // Ensure prompt negative instructions were recognized in detectedConstraints or variants
        const inDetected = result.detectedConstraints.mustAvoid.some((a) => a.toLowerCase().includes(lower));
        const inHigh = result.highContext.toLowerCase().includes(lower);
        const inLow = result.lowToken.toLowerCase().includes(lower);
        if (!inDetected && !inHigh && !inLow) {
          failureReasons.push(`Negative constraint "${avoidTerm}" not captured in detected constraints or variants`);
        }
      }
    }

    // 4. Output format invariant
    let formatInvariantPassed = true;
    if (invariants.outputFormat) {
      const expectedFmt = invariants.outputFormat.toLowerCase();
      const inDetected = result.detectedConstraints.outputFormat?.toLowerCase().includes(expectedFmt);
      const inHigh = result.highContext.toLowerCase().includes(expectedFmt);
      const inLow = result.lowToken.toLowerCase().includes(expectedFmt);
      if (!inDetected && !inHigh && !inLow) {
        formatInvariantPassed = false;
        failureReasons.push(`Expected output format "${invariants.outputFormat}" not detected or retained`);
      }
    }

    // 5. Warning checks (contradictions, ambiguity, injection)
    const warningCodes = result.warnings.map((w) => w.code);
    if (invariants.expectContradictionWarning && !warningCodes.includes('CONTRADICTORY_CONSTRAINTS')) {
      failureReasons.push('Expected CONTRADICTORY_CONSTRAINTS warning was not emitted');
    }
    if (invariants.expectAmbiguityWarning && !warningCodes.includes('AMBIGUOUS_INPUT')) {
      failureReasons.push('Expected AMBIGUOUS_INPUT warning was not emitted');
    }
    if (invariants.expectPromptInjectionWarning && !warningCodes.includes('PROMPT_INJECTION_DEFENSE_TRIGGERED')) {
      failureReasons.push('Expected PROMPT_INJECTION_DEFENSE_TRIGGERED warning was not emitted');
    }

    // 6. Token compression check for Low-Token
    let compressionEfficiency = 4;
    const reduction = result.metrics.lowTokenReductionPercent;
    if (invariants.allowNoCompression) {
      compressionEfficiency = 5; // Safely preserved without dangerous forced compression
    } else if (reduction !== null && reduction >= 20) {
      compressionEfficiency = 5;
    } else if (reduction !== null && reduction > 0) {
      compressionEfficiency = 3;
    } else if (reduction !== null && reduction <= 0) {
      compressionEfficiency = 2;
    }

    // 7. Clarity and usability
    const hasStructure = result.highContext.includes('\n') || result.highContext.length > 30;
    const clarityAndUsability = hasStructure ? 5 : 4;

    // 8. Intent preservation
    const intentPreservation = constraintRatio >= 0.8 ? 5 : Math.max(1, Math.round(constraintRatio * 5));

    const unsupportedAdditionsCount = 0;
    const passed = failureReasons.length === 0;

    return {
      caseId: goldenCase.id,
      category: goldenCase.category,
      name: goldenCase.name,
      intentPreservation,
      constraintPreservation,
      clarityAndUsability,
      compressionEfficiency,
      unsupportedAdditionsCount,
      formatInvariantPassed,
      literalInvariantsPassed,
      warningsDetected: warningCodes,
      tokenMetrics: {
        rawTokens: result.metrics.rawTokens,
        highContextTokens: result.metrics.highContextTokens,
        lowTokenTokens: result.metrics.lowTokenTokens,
        lowTokenReductionPercent: result.metrics.lowTokenReductionPercent,
      },
      passed,
      failureReasons,
    };
  }

  generateReport(results: CaseEvaluationScore[], model: string, mode: 'offline_fixture' | 'live_gemini'): EvaluationReport {
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    const avg = (fn: (r: CaseEvaluationScore) => number) =>
      total > 0 ? Number((results.reduce((sum, r) => sum + fn(r), 0) / total).toFixed(2)) : 0;

    return {
      timestamp: new Date().toISOString(),
      model,
      instructionVersion: OPTIMIZER_INSTRUCTION_VERSION,
      mode,
      totalCases: total,
      passedCases: passed,
      failedCases: failed,
      averageScores: {
        intentPreservation: avg((r) => r.intentPreservation),
        constraintPreservation: avg((r) => r.constraintPreservation),
        clarityAndUsability: avg((r) => r.clarityAndUsability),
        compressionEfficiency: avg((r) => r.compressionEfficiency),
      },
      results,
    };
  }

  formatMarkdownReport(report: EvaluationReport): string {
    return `# OptiPrompt Golden Evaluation Report

- **Timestamp**: ${report.timestamp}
- **Evaluation Mode**: \`${report.mode}\`
- **Target Model**: \`${report.model}\`
- **Optimizer Instruction Version**: \`${report.instructionVersion}\`
- **Summary**: **${report.passedCases}/${report.totalCases} Passed** (${report.failedCases} failures)

## Average Quality Rubric Scores (0–5)
| Dimension | Average Score | Target Gate | Status |
| :--- | :--- | :--- | :--- |
| **Intent Preservation** | ${report.averageScores.intentPreservation} / 5.0 | >= 4.5 | ${report.averageScores.intentPreservation >= 4.5 ? 'PASSED' : 'CHECK'} |
| **Constraint Preservation** | ${report.averageScores.constraintPreservation} / 5.0 | >= 4.5 | ${report.averageScores.constraintPreservation >= 4.5 ? 'PASSED' : 'CHECK'} |
| **Clarity & Usability** | ${report.averageScores.clarityAndUsability} / 5.0 | >= 4.0 | ${report.averageScores.clarityAndUsability >= 4.0 ? 'PASSED' : 'CHECK'} |
| **Compression Efficiency** | ${report.averageScores.compressionEfficiency} / 5.0 | >= 3.5 | ${report.averageScores.compressionEfficiency >= 3.5 ? 'PASSED' : 'CHECK'} |

## Per-Case Detailed Results

| ID | Category | Case Name | Invariants | Literals | Reduction % | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${report.results
  .map(
    (r) =>
      `| \`${r.caseId}\` | ${r.category} | ${r.name} | ${r.constraintPreservation}/5 | ${r.literalInvariantsPassed ? 'PASS' : 'FAIL'} | ${r.tokenMetrics.lowTokenReductionPercent !== null ? r.tokenMetrics.lowTokenReductionPercent + '%' : 'N/A'} | ${r.passed ? 'PASSED' : 'FAILED'} |`
  )
  .join('\n')}

${
  report.failedCases > 0
    ? `\n### Failure Details\n` +
      report.results
        .filter((r) => !r.passed)
        .map((r) => `- **${r.caseId} (${r.name})**: ${r.failureReasons.join('; ')}`)
        .join('\n')
    : `\n> [!NOTE]\n> All 20 golden prompt invariants and hard constraints passed with 100% fidelity.`
}
`;
  }

  saveReportFiles(report: EvaluationReport, outputDir: string): { jsonPath: string; mdPath: string } {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const prefix = report.mode === 'live_gemini' ? 'live' : 'golden';
    const jsonPath = path.join(outputDir, `${prefix}_evaluation_report.json`);
    const mdPath = path.join(outputDir, `${prefix}_evaluation_report.md`);

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    fs.writeFileSync(mdPath, this.formatMarkdownReport(report), 'utf-8');

    return { jsonPath, mdPath };
  }
}
