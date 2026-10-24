import React from 'react';
import { DollarSign, Info } from 'lucide-react';
import { Metrics } from '../types/index.js';

interface TokenComparisonBarProps {
  metrics: Metrics;
}

export const TokenComparisonBar: React.FC<TokenComparisonBarProps> = ({ metrics }) => {
  const {
    rawTokens,
    highContextTokens,
    lowTokenTokens,
    highContextChangePercent,
    lowTokenReductionPercent,
    measuredWith,
    costEstimate,
  } = metrics;

  const maxVal = Math.max(rawTokens || 1, highContextTokens || 1, lowTokenTokens || 1);

  const rawWidth = rawTokens !== null ? Math.max(10, Math.round((rawTokens / maxVal) * 100)) : 0;
  const highWidth = highContextTokens !== null ? Math.max(10, Math.round((highContextTokens / maxVal) * 100)) : 0;
  const lowWidth = lowTokenTokens !== null ? Math.max(10, Math.round((lowTokenTokens / maxVal) * 100)) : 0;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Native Token Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Measured with {measuredWith} (Input Tokens)
          </p>
        </div>

        {/* Estimated Cost Callout */}
        {costEstimate && (
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Est. Input Cost:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {costEstimate.inputCost !== null
                ? `$${costEstimate.inputCost.toFixed(6)} ${costEstimate.currency}`
                : 'N/A'}
            </span>
          </div>
        )}
      </div>

      {/* Proportional Bars */}
      <div className="space-y-3">
        {/* Original */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <span className="text-slate-400">Original Prompt</span>
            <span className="font-mono text-slate-200">
              {rawTokens !== null ? `${rawTokens.toLocaleString()} tokens` : 'Unavailable'}
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-slate-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${rawWidth}%` }}
            />
          </div>
        </div>

        {/* High-Context */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <div className="flex items-center space-x-2">
              <span className="text-sky-400">High-Context Variant</span>
              {highContextChangePercent !== null && (
                <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px]">
                  {highContextChangePercent >= 0 ? `+${highContextChangePercent}%` : `${highContextChangePercent}%`}
                </span>
              )}
            </div>
            <span className="font-mono text-sky-300">
              {highContextTokens !== null ? `${highContextTokens.toLocaleString()} tokens` : 'Unavailable'}
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${highWidth}%` }}
            />
          </div>
        </div>

        {/* Low-Token */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400">Low-Token Variant</span>
              {lowTokenReductionPercent !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    lowTokenReductionPercent >= 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {lowTokenReductionPercent >= 0
                    ? `-${lowTokenReductionPercent}% tokens`
                    : `+${Math.abs(lowTokenReductionPercent)}% tokens`}
                </span>
              )}
            </div>
            <span className="font-mono text-emerald-300 font-semibold">
              {lowTokenTokens !== null ? `${lowTokenTokens.toLocaleString()} tokens` : 'Unavailable'}
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${lowWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assumptions Note */}
      {costEstimate && costEstimate.assumptions.length > 0 && (
        <div className="flex items-start space-x-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
          <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-300">Cost Assumptions: </span>
            {costEstimate.assumptions.map((item, idx) => (
              <span key={idx} className="block text-slate-400">
                • {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
