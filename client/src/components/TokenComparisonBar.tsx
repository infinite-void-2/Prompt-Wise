import React from 'react';
import { DollarSign, Info } from 'lucide-react';
import { Metrics } from '../types/index.js';

interface TokenComparisonBarProps {
  metrics: Metrics;
}

export const TokenComparisonBar: React.FC<TokenComparisonBarProps> = React.memo(({ metrics }) => {
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
    <div className="glass-panel rounded-2xl p-5 border border-[#282A2C] shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282A2C] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Native Token Analytics
          </h2>
          <p className="text-xs text-[#9AA0A6]">
            Measured with {measuredWith} (Input Tokens)
          </p>
        </div>

        {/* Estimated Cost Callout */}
        {costEstimate && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-[#282A2C] px-2.5 py-1 rounded-lg border border-[#3C4043] text-xs text-[#E3E3E3]">
              <DollarSign className="w-3.5 h-3.5 text-[#81C995]" />
              <span>Input:</span>
              <span className="font-mono text-[#81C995] font-semibold">
                {costEstimate.inputCost !== null
                  ? `$${costEstimate.inputCost.toFixed(6)}`
                  : 'N/A'}
              </span>
            </div>

            {costEstimate.estimatedOutputCost !== undefined && costEstimate.estimatedOutputCost !== null && (
              <div className="flex items-center space-x-1.5 bg-[#282A2C] px-2.5 py-1 rounded-lg border border-[#3C4043] text-xs text-[#E3E3E3]">
                <span>Output (~{costEstimate.estimatedOutputTokens || 160} tok):</span>
                <span className="font-mono text-[#8AB4F8] font-semibold">
                  ${costEstimate.estimatedOutputCost.toFixed(6)}
                </span>
              </div>
            )}

            {costEstimate.costPer1kCalls !== undefined && costEstimate.costPer1kCalls !== null && (
              <div className="flex items-center space-x-1.5 bg-[#1E2E25] px-2.5 py-1 rounded-lg border border-[#2E573D] text-xs text-[#81C995]">
                <span>Total/1k Calls:</span>
                <span className="font-mono text-[#81C995] font-bold">
                  ${costEstimate.costPer1kCalls.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proportional Bars */}
      <div className="space-y-3">
        {/* Original */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <span className="text-[#9AA0A6]">Original Prompt</span>
            <div className="flex items-center space-x-2">
              {rawTokens !== null && (
                <span className="font-mono text-[#9AA0A6] text-[11px]">
                  ~${((rawTokens / 1_000_000) * 0.075).toFixed(6)}
                </span>
              )}
              <span className="font-mono text-[#E3E3E3]">
                {rawTokens !== null ? `${rawTokens.toLocaleString()} tokens` : 'Unavailable'}
              </span>
            </div>
          </div>
          <div className="w-full bg-[#131314] rounded-full h-3 overflow-hidden p-0.5 border border-[#282A2C]">
            <div
              className="bg-[#747775] h-full rounded-full transition-all duration-500"
              style={{ width: `${rawWidth}%` }}
            />
          </div>
        </div>

        {/* High-Context */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <div className="flex items-center space-x-2">
              <span className="text-[#8AB4F8]">High-Context Variant</span>
              {highContextChangePercent !== null && (
                <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-[#8AB4F8] border border-blue-500/20 text-[10px]">
                  {highContextChangePercent >= 0 ? `+${highContextChangePercent}%` : `${highContextChangePercent}%`}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {highContextTokens !== null && (
                <span className="font-mono text-[#8AB4F8]/70 text-[11px]">
                  ~${((highContextTokens / 1_000_000) * 0.075).toFixed(6)}
                </span>
              )}
              <span className="font-mono text-[#8AB4F8]">
                {highContextTokens !== null ? `${highContextTokens.toLocaleString()} tokens` : 'Unavailable'}
              </span>
            </div>
          </div>
          <div className="w-full bg-[#131314] rounded-full h-3 overflow-hidden p-0.5 border border-[#282A2C]">
            <div
              className="bg-[#8AB4F8] h-full rounded-full transition-all duration-500"
              style={{ width: `${highWidth}%` }}
            />
          </div>
        </div>

        {/* Low-Token */}
        <div>
          <div className="flex justify-between text-xs mb-1 font-medium">
            <div className="flex items-center space-x-2">
              <span className="text-[#81C995]">Low-Token Variant</span>
              {lowTokenReductionPercent !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    lowTokenReductionPercent > 0
                      ? 'bg-[#1E2E25] text-[#81C995] border border-[#2E573D]'
                      : lowTokenReductionPercent === 0
                      ? 'bg-[#282A2C] text-[#C4C7C5] border border-[#3C4043]'
                      : 'bg-[#3B2B1B] text-[#FDD663] border border-[#5E4325]'
                  }`}
                >
                  {lowTokenReductionPercent > 0
                    ? `-${lowTokenReductionPercent}% tokens`
                    : lowTokenReductionPercent === 0
                    ? `0% delta (optimal)`
                    : `+${Math.abs(lowTokenReductionPercent)}% tokens`}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {lowTokenTokens !== null && (
                <span className="font-mono text-[#81C995]/80 text-[11px]">
                  ~${((lowTokenTokens / 1_000_000) * 0.075).toFixed(6)}
                </span>
              )}
              <span className="font-mono text-[#81C995] font-semibold">
                {lowTokenTokens !== null ? `${lowTokenTokens.toLocaleString()} tokens` : 'Unavailable'}
              </span>
            </div>
          </div>
          <div className="w-full bg-[#131314] rounded-full h-3 overflow-hidden p-0.5 border border-[#282A2C]">
            <div
              className="bg-[#81C995] h-full rounded-full transition-all duration-500"
              style={{ width: `${lowWidth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assumptions Note */}
      {costEstimate && costEstimate.assumptions.length > 0 && (
        <div className="flex items-start space-x-2 text-[11px] text-[#9AA0A6] bg-[#131314] p-3 rounded-xl border border-[#282A2C]">
          <Info className="w-3.5 h-3.5 text-[#9AA0A6] mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#E3E3E3]">Cost Assumptions: </span>
            {costEstimate.assumptions.map((item, idx) => (
              <span key={idx} className="block text-[#9AA0A6]">
                • {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

TokenComparisonBar.displayName = 'TokenComparisonBar';
