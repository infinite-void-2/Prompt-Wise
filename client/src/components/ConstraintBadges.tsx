import React from 'react';
import { ShieldCheck, Ban, Code, FileText, Globe, Clock } from 'lucide-react';
import { DetectedConstraints } from '../types/index.js';

interface ConstraintBadgesProps {
  constraints: DetectedConstraints;
  intentSummary?: string;
}

export const ConstraintBadges: React.FC<ConstraintBadgesProps> = ({
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
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-md space-y-3">
      <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Detected Invariants & Constraints</span>
      </div>

      {intentSummary && (
        <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <span className="font-semibold text-slate-200">Goal: </span>
          {intentSummary}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {/* Output Format */}
        {outputFormat && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-sky-950/50 border border-sky-800/60 text-sky-300">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px]">Format:</span>
            <span className="font-semibold">{outputFormat}</span>
          </div>
        )}

        {/* Length Limit */}
        {lengthLimit && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/50 border border-indigo-800/60 text-indigo-300">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px]">Limit:</span>
            <span className="font-semibold">{lengthLimit}</span>
          </div>
        )}

        {/* Language */}
        {language && language !== 'en' && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-950/50 border border-purple-800/60 text-purple-300">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px]">Language:</span>
            <span className="font-semibold">{language}</span>
          </div>
        )}

        {/* Must Preserve */}
        {mustPreserve.map((term, i) => (
          <div
            key={i}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{term}</span>
          </div>
        ))}

        {/* Must Avoid (Negative Constraints) */}
        {mustAvoid.map((term, i) => (
          <div
            key={i}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300"
          >
            <Ban className="w-3 h-3 text-red-400" />
            <span>Avoid: {term}</span>
          </div>
        ))}

        {/* Exact Literals */}
        {exactLiterals.map((lit, i) => (
          <div
            key={i}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-amber-300 mono-font text-[11px]"
          >
            <Code className="w-3 h-3 text-amber-400" />
            <span>{lit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
