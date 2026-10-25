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

export const VariantColumn: React.FC<VariantColumnProps> = React.memo(({
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
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(currentText);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = currentText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Non-fatal copy error
      }
    }
  };

  const handleReset = () => {
    onTextChange(initialText);
  };

  const getBorderClass = () => {
    if (isRecommended) return 'ring-2 ring-[#81C995]/70 border-[#2E573D] shadow-lg shadow-[#81C995]/5';
    if (accentColor === 'sky') return 'border-[#2B3E5A]';
    if (accentColor === 'emerald') return 'border-[#2E573D]';
    return 'border-[#282A2C]';
  };

  const getHeaderBg = () => {
    if (accentColor === 'sky') return 'bg-[#1E2838]/80 text-[#8AB4F8] border-b border-[#2B3E5A]/60';
    if (accentColor === 'emerald') return 'bg-[#1E2E25]/80 text-[#81C995] border-b border-[#2E573D]/60';
    return 'bg-[#1E1F20] text-[#E3E3E3] border-b border-[#282A2C]';
  };

  return (
    <div
      className={`glass-panel rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm border transition-all ${getBorderClass()}`}
    >
      {/* Top Header */}
      <div className={`p-4 ${getHeaderBg()}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold tracking-tight text-white">{title}</h3>
            {isRecommended && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#1E2E25] border border-[#2E573D] text-[#81C995] text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#81C995]" />
                <span>Recommended</span>
              </span>
            )}
          </div>

          {/* Token count & delta */}
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#282A2C] text-[#E3E3E3] border border-[#3C4043] font-semibold">
              {tokenCount !== null ? `${tokenCount} tokens` : 'N/A'}
            </span>
            {deltaPercent !== null && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  variantType === 'highContext'
                    ? deltaPercent >= 0
                      ? 'bg-[#1E2838] text-[#8AB4F8] border border-[#2B3E5A]'
                      : 'bg-[#282A2C] text-[#9AA0A6] border border-[#3C4043]'
                    : deltaPercent > 0
                    ? 'bg-[#1E2E25] text-[#81C995] border border-[#2E573D]'
                    : deltaPercent === 0
                    ? 'bg-[#282A2C] text-[#9AA0A6] border border-[#3C4043]'
                    : 'bg-[#3B2B1B] text-[#FDD663] border border-[#5E4325]'
                }`}
              >
                {variantType === 'highContext'
                  ? deltaPercent > 0
                    ? `+${deltaPercent}%`
                    : deltaPercent === 0
                    ? '0%'
                    : `-${Math.abs(deltaPercent)}%`
                  : deltaPercent > 0
                  ? `-${deltaPercent}%`
                  : deltaPercent === 0
                  ? '0%'
                  : `+${Math.abs(deltaPercent)}%`}
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-[#9AA0A6] leading-tight">{subtitle}</p>

        {/* Model Attribution & Verification Badges */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
          {variantType === 'original' ? (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#282A2C] border border-[#3C4043] text-[#C4C7C5] font-medium">
              <span>Source: User Input</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1E2E25] border border-[#2E573D] text-[#81C995] font-medium">
              <Cpu className="w-3 h-3 text-[#81C995]" />
              <span>Optimized by: <strong>{modelInfo.name}</strong></span>
              <span className="text-[#81C995]/70 font-mono text-[9px]">({targetProvider || modelInfo.providerName} · {generatingModel || 'nvidia/nemotron-3.5-bolt-e4b'})</span>
            </span>
          )}

          {verificationDetails && (
            verificationDetails.passed ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#1E2E25] border border-[#2E573D] text-[#81C995] text-[10px] font-medium">
                <ShieldCheck className="w-3 h-3 text-[#81C995]" />
                <span>Verified: Invariants Intact</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#3B181A] border border-[#6B2529] text-[#F28B82] text-[10px] font-medium">
                <AlertTriangle className="w-3 h-3 text-[#F28B82]" />
                <span>Verification Gated</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Editor & Content Area */}
      <div className="p-4 flex-1 flex flex-col space-y-2">
        <div className="flex justify-between items-center w-full mb-2 mt-1 text-xs">
          <div className="flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-[#9AA0A6]" />
            <span className="text-sm text-[#9AA0A6] font-medium">Prompt Text (Editable):</span>
            {isEdited && (
              <span className="px-1.5 py-0.2 rounded bg-[#3B2B1B] border border-[#5E4325] text-[#FDD663] text-[10px] font-bold">
                Edited
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isEdited && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center space-x-1 text-xs text-[#9AA0A6] hover:text-[#E3E3E3] transition-colors p-1 rounded hover:bg-[#282A2C] focus-visible:ring-2 focus-visible:ring-[#8AB4F8]"
                title="Reset to generated variant"
                aria-label={`Reset ${title} to generated text`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            {/* Top-Right Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 hover:bg-[#282A2C] rounded-md transition-colors text-[#9AA0A6] hover:text-white flex items-center space-x-1 text-xs focus-visible:ring-2 focus-visible:ring-[#8AB4F8]"
              title="Copy prompt text"
              id={`copy-btn-${id}`}
              aria-label="Copy prompt text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#81C995]" />
                  <span className="text-[#81C995] text-xs font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#9AA0A6]" />
                  <span className="text-xs">Copy</span>
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
          aria-label={`Prompt text for ${title}`}
          className="w-full flex-1 max-h-[350px] overflow-y-auto bg-[#131314] text-[#E3E3E3] rounded-xl p-3 text-xs font-mono leading-relaxed focus:outline-none border border-[#282A2C] focus:border-[#8AB4F8] focus:ring-1 focus:ring-[#8AB4F8]/30 resize-y"
        />
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-[#1E1F20] border-t border-[#282A2C] flex items-center justify-end gap-2">
        {isCurrentExecuting ? (
          <button
            type="button"
            onClick={onStop}
            id={`stop-btn-${id}`}
            aria-label={`Stop executing ${title}`}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md bg-[#D93025] hover:bg-[#C5221F] text-white animate-pulse transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#F28B82]"
            title="Stop prompt execution"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Execution</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onExecute}
            disabled={isExecuting || !currentText.trim()}
            id={`execute-btn-${id}`}
            aria-label={`Execute ${title}`}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#8AB4F8] ${
              isExecuting || !currentText.trim()
                ? 'bg-[#282A2C] text-[#5F6368] cursor-not-allowed border border-[#3C4043]/40'
                : 'bg-[#1A73E8] hover:bg-[#1B66CA] text-white active:scale-[0.98]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Waiting...' : 'Execute this prompt'}</span>
          </button>
        )}
      </div>
    </div>
  );
});

VariantColumn.displayName = 'VariantColumn';
