import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';
import { OptimizationWarning } from '../types/index.js';

interface WarningsBannerProps {
  warnings: OptimizationWarning[];
}

export const WarningsBanner: React.FC<WarningsBannerProps> = React.memo(({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning, idx) => {
        const isInjection = warning.code === 'PROMPT_INJECTION_DEFENSE_TRIGGERED';
        const isContradiction = warning.code === 'CONTRADICTORY_CONSTRAINTS';

        return (
          <div
            key={idx}
            className={`flex items-start space-x-3 p-3.5 rounded-xl border text-xs ${
              isInjection
                ? 'bg-[#282038] border-[#41335A] text-[#C58AF9]'
                : isContradiction
                ? 'bg-[#3B2B1B] border-[#5E4325] text-[#FDD663]'
                : 'bg-[#3B2B1B]/80 border-[#5E4325]/80 text-[#FDD663]'
            }`}
          >
            {isInjection ? (
              <ShieldAlert className="w-4 h-4 text-[#C58AF9] flex-shrink-0 mt-0.5" />
            ) : isContradiction ? (
              <AlertTriangle className="w-4 h-4 text-[#FDD663] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#FDD663] flex-shrink-0 mt-0.5" />
            )}

            <div className="space-y-0.5">
              <span className="font-semibold uppercase tracking-wider text-[10px] block opacity-90">
                {warning.code}
              </span>
              <p className="leading-relaxed text-[#E3E3E3]">{warning.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

WarningsBanner.displayName = 'WarningsBanner';

export { WarningBanner } from './WarningBanner.js';
