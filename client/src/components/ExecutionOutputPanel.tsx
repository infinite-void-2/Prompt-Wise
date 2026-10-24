import React, { useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Cpu,
  Hash,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Send,
} from 'lucide-react';
import { submitFeedback } from '../lib/api.js';
import { ExecutionResult } from '../types/index.js';

interface ExecutionOutputPanelProps {
  result: ExecutionResult;
  variantType: 'original' | 'highContext' | 'lowToken' | 'custom';
}

export const ExecutionOutputPanel: React.FC<ExecutionOutputPanelProps> = ({
  result,
  variantType,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackRating) return;
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        requestId: result.requestId,
        variantType,
        rating: feedbackRating,
        reason: feedbackReason.trim() || undefined,
      });
      setFeedbackSubmitted(true);
    } catch {
      // Non-fatal feedback error
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div
      id="execution-output-card"
      className="glass-panel-glow rounded-2xl p-6 border shadow-2xl space-y-4 transition-all"
    >
      {/* Top Header: Title & Copy Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Gemini Execution Response
            </h2>
            <p className="text-xs text-slate-400">
              Generated response from executing the selected prompt
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          id="copy-execution-response-btn"
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Response Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Response</span>
            </>
          )}
        </button>
      </div>

      {/* Metadata Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Model</span>
            <span className="font-mono font-semibold text-slate-200">{result.model}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Observed Latency</span>
            <span className="font-mono font-semibold text-sky-300">{result.latencyMs} ms</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <Hash className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Input Tokens</span>
            <span className="font-mono font-semibold text-emerald-300">
              {result.usage?.promptTokens ?? 'N/A'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <Hash className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">Output Tokens</span>
            <span className="font-mono font-semibold text-purple-300">
              {result.usage?.candidateTokens ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Response Text Output */}
      <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 max-h-96 overflow-y-auto">
        <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
          {result.response}
        </pre>
      </div>

      {/* User Feedback Widget (FR-7) */}
      <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Was this response helpful?</span>
          {!feedbackSubmitted ? (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFeedbackRating('helpful')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedbackRating === 'helpful'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Helpful"
                id="feedback-helpful-btn"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFeedbackRating('not_helpful')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedbackRating === 'not_helpful'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Not helpful"
                id="feedback-not-helpful-btn"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-emerald-400 font-medium">Thank you for your feedback!</span>
          )}
        </div>

        {feedbackRating && !feedbackSubmitted && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="text"
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              placeholder="Optional: reason (e.g. format followed perfectly)"
              className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 sm:w-64"
            />
            <button
              onClick={handleSendFeedback}
              disabled={isSubmittingFeedback}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Submit</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
