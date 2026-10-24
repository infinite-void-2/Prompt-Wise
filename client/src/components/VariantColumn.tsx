import React, { useState } from 'react';
import { Copy, Check, Play, RotateCcw, Sparkles, Edit3, Square, ShieldCheck, AlertTriangle, Cpu } from 'lucide-react';
import { getModelDisplayName } from '../lib/models.js';
import { VerificationDetails } from '../types/index.js';

interface VariantColumnProps {
  id: string;
  title: string;
  subtitle: string;
  variantType: 'original' | 'highContext' | 'lowToken';
  initialText: string;
  currentText: string;
  onTextChange: (newText: string) => void;
  tokenCount: number | null;
  deltaPercent: number | null;
  isRecommended?: boolean;
  onExecute: () => void;
  onStop?: () => void;
  isExecuting: boolean;
  isCurrentExecuting?: boolean;
  verificationDetails?: VerificationDetails;
  accentColor: 'slate' | 'sky' | 'emerald';
  generatingModel?: string;
  targetProvider?: string;
}

export const VariantColumn: React.FC<VariantColumnProps> = ({
  id,
  title,
  subtitle,
  variantType,
  initialText,
  currentText,
  onTextChange,
  tokenCount,
  deltaPercent,
  isRecommended = false,
  onExecute,
  onStop,
  isExecuting,
  isCurrentExecuting = false,
  verificationDetails,
  accentColor,
  generatingModel,
  targetProvider,
}) => {
  const [copied, setCopied] = useState(false);
  const isEdited = currentText.trim() !== initialText.trim();
  const modelInfo = getModelDisplayName(generatingModel);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleReset = () => {
    onTextChange(initialText);
  };

  const getBorderClass = () => {
    if (isRecommended) return 'ring-2 ring-emerald-500/50 border-emerald-500/30';
    if (accentColor === 'sky') return 'border-sky-800/40';
    if (accentColor === 'emerald') return 'border-emerald-800/40';
    return 'border-slate-800';
  };

  const getHeaderBg = () => {
    if (accentColor === 'sky') return 'bg-sky-950/20 text-sky-300';
    if (accentColor === 'emerald') return 'bg-emerald-950/20 text-emerald-300';
    return 'bg-slate-900/40 text-slate-300';
  };

  return (
    <div
      className={`glass-panel rounded-2xl flex flex-col justify-between overflow-hidden shadow-xl border transition-all ${getBorderClass()}`}
    >
      {/* Top Header */}
      <div className={`p-4 border-b border-slate-800/80 ${getHeaderBg()}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
            {isRecommended && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Recommended</span>
              </span>
            )}
          </div>

          {/* Token count & delta */}
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800/90 text-slate-200 border border-slate-700/60 font-semibold">
              {tokenCount !== null ? `${tokenCount} tokens` : 'N/A'}
            </span>
            {deltaPercent !== null && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  deltaPercent > 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : deltaPercent < 0
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {deltaPercent > 0 ? `-${deltaPercent}%` : deltaPercent === 0 ? '0%' : `+${Math.abs(deltaPercent)}%`}
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">{subtitle}</p>

        {/* Model Attribution & Verification Badges */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
          {variantType === 'original' ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-slate-300 font-medium">
              <span>Source: User Input</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>Optimized by: <strong>{modelInfo.name}</strong></span>
              <span className="text-emerald-400/70 font-mono text-[9px]">({targetProvider || modelInfo.providerName} · {generatingModel || 'nvidia/nemotron-3.5-bolt-e4b'})</span>
            </span>
          )}

          {verificationDetails && (
            verificationDetails.passed ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified: Invariants Intact</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-medium">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Verification Gated</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Editor & Content Area */}
      <div className="p-4 flex-1 flex flex-col space-y-2">
        <div className="flex justify-between items-center mb-2 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium">Prompt Text (Editable):</span>
            {isEdited && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                Edited
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isEdited && (
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800"
                title="Reset to generated variant"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            {/* Top-Right Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-700 dark:hover:bg-[#282a2c] rounded-md transition-colors text-gray-400 dark:text-gray-300 hover:text-white flex items-center space-x-1 text-xs"
              title="Copy prompt text"
              id={`copy-btn-${id}`}
              aria-label="Copy prompt text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          id={`variant-textarea-${id}`}
          value={currentText}
          onChange={(e) => onTextChange(e.target.value)}
          rows={8}
          className="w-full flex-1 max-h-[400px] overflow-y-auto bg-slate-900/80 text-slate-200 rounded-xl p-3 text-xs font-mono leading-relaxed focus:outline-none border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 resize-y"
        />
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-end gap-2">
        {isCurrentExecuting ? (
          <button
            onClick={onStop}
            id={`stop-btn-${id}`}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md bg-rose-600 hover:bg-rose-500 text-white animate-pulse transition-all active:scale-[0.98]"
            title="Stop prompt execution"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Execution</span>
          </button>
        ) : (
          <button
            onClick={onExecute}
            disabled={isExecuting || !currentText.trim()}
            id={`execute-btn-${id}`}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
              isExecuting || !currentText.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : accentColor === 'emerald' || isRecommended
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.98]'
                : 'bg-slate-700 hover:bg-slate-600 text-white active:scale-[0.98]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Waiting...' : 'Execute this prompt'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
