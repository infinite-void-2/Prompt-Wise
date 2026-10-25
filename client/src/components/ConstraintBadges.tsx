import React from 'react';
import { ShieldCheck, Ban, Code, FileText, Globe, Clock } from 'lucide-react';
import { DetectedConstraints } from '../types/index.js';

interface ConstraintBadgesProps {
  constraints: DetectedConstraints;
  intentSummary?: string;
}

export const ConstraintBadges: React.FC<ConstraintBadgesProps> = React.memo(({
  constraints,
  intentSummary,
}) => {
  const { mustPreserve, outputFormat, lengthLimit, language, mustAvoid, exactLiterals } =
    constraints;

  const hasAny =
    mustPreserve.length > 0 ||
    outputFormat ||
    lengthLimit ||
    language ||
    mustAvoid.length > 0 ||
    exactLiterals.length > 0 ||
    intentSummary;

  if (!hasAny) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-[#282A2C] shadow-sm space-y-3">
      <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#9AA0A6]">
        <ShieldCheck className="w-4 h-4 text-[#81C995]" />
        <span>Detected Invariants & Constraints</span>
      </div>

      {intentSummary && (
        <div className="text-xs text-[#E3E3E3] bg-[#131314] p-3 rounded-xl border border-[#282A2C]">
          <span className="font-semibold text-white">Goal: </span>
          {intentSummary}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {/* Output Format */}
        {outputFormat && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#1E2838] border border-[#2B3E5A] text-[#8AB4F8]">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px]">Format:</span>
            <span className="font-semibold">{outputFormat}</span>
          </div>
        )}

        {/* Length Limit */}
        {lengthLimit && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#282038] border border-[#41335A] text-[#C58AF9]">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px]">Limit:</span>
            <span className="font-semibold">{lengthLimit}</span>
          </div>
        )}

        {/* Language */}
        {language && language !== 'en' && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#282038] border border-[#41335A] text-[#C58AF9]">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px]">Language:</span>
            <span className="font-semibold">{language}</span>
          </div>
        )}

        {/* Must Preserve */}
        {mustPreserve.map((term, i) => (
          <div
            key={i}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#1E2E25] border border-[#2E573D] text-[#81C995]"
          >
            <ShieldCheck className="w-3 h-3 text-[#81C995]" />
            <span>{term}</span>
          </div>
        ))}

        {/* Must Avoid (Negative Constraints) */}
        {mustAvoid.map((term, i) => (
          <div
            key={i}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#3B181A] border border-[#6B2529] text-[#F28B82]"
          >
            <Ban className="w-3 h-3 text-[#F28B82]" />
            <span>Avoid: {term}</span>
          </div>
        ))}

        {/* Exact Literals */}
        {exactLiterals.map((lit, i) => (
          <div
            key={i}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#282A2C] border border-[#3C4043] text-[#FDD663] mono-font text-[11px]"
          >
            <Code className="w-3 h-3 text-[#FDD663]" />
            <span>{lit}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

ConstraintBadges.displayName = 'ConstraintBadges';
