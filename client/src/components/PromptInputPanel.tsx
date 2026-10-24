import React from 'react';
import { ArrowRight, Loader2, Sparkles, Trash2, BookOpen } from 'lucide-react';
import { EXAMPLE_PROMPTS } from '../lib/examples.js';
import { TaskCategory } from '../types/index.js';

interface PromptInputPanelProps {
  rawPrompt: string;
  onPromptChange: (val: string) => void;
  category: TaskCategory;
  onCategoryChange: (cat: TaskCategory) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
  progressStep: string | null;
  maxChars?: number;
}

const CATEGORIES: TaskCategory[] = [
  'Auto',
  'Coding',
  'Writing',
  'Summarization',
  'Data Extraction',
  'Reasoning',
  'Creative',
  'Other',
];

export const PromptInputPanel: React.FC<PromptInputPanelProps> = ({
  rawPrompt,
  onPromptChange,
  category,
  onCategoryChange,
  onOptimize,
  isOptimizing,
  progressStep,
  maxChars = 20000,
}) => {
  const charCount = rawPrompt.length;
  const isTooLong = charCount > maxChars;
  const isEmpty = rawPrompt.trim().length === 0;

  const handleSelectExample = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = EXAMPLE_PROMPTS.find((ex) => ex.id === e.target.value);
    if (selected) {
      onPromptChange(selected.prompt);
      onCategoryChange(selected.category);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-xl border border-slate-800">
      {/* Top Toolbar: Category & Example Prompts */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <label htmlFor="category-select" className="text-xs font-medium text-slate-400">
            Task Category:
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as TaskCategory)}
            disabled={isOptimizing}
            className="bg-slate-800/90 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <label htmlFor="example-select" className="text-xs font-medium text-slate-400">
            Load Example:
          </label>
          <select
            id="example-select"
            defaultValue=""
            onChange={handleSelectExample}
            disabled={isOptimizing}
            className="bg-slate-800/90 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium max-w-[220px]"
          >
            <option value="" disabled>
              Select sample prompt...
            </option>
            {EXAMPLE_PROMPTS.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Resizable Textarea */}
      <div className="relative">
        <textarea
          id="raw-prompt-input"
          value={rawPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Paste or write your raw prompt here... (e.g. 'Extract name and age as valid JSON with keys name and age without markdown')"
          rows={5}
          disabled={isOptimizing}
          className={`w-full bg-slate-900/90 text-slate-100 rounded-xl p-4 text-sm font-sans focus:outline-none border transition-all resize-y ${
            isTooLong
              ? 'border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50'
          }`}
        />

        {rawPrompt && !isOptimizing && (
          <button
            onClick={() => onPromptChange('')}
            className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors"
            title="Clear prompt"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bottom Footer: Character Count & Optimize Button */}
      <div className="flex flex-wrap items-center justify-between mt-3 gap-3">
        <div className="flex items-center space-x-3 text-xs">
          <span className={`${isTooLong ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
          </span>
          {isTooLong && (
            <span className="text-red-400">Prompt exceeds maximum character limit.</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* Real progress step state during work */}
          {isOptimizing && progressStep && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/40 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{progressStep}</span>
            </div>
          )}

          <button
            id="optimize-prompt-btn"
            onClick={onOptimize}
            disabled={isEmpty || isTooLong || isOptimizing}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
              isEmpty || isTooLong || isOptimizing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 ring-1 ring-emerald-400/40 active:scale-[0.98]'
            }`}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Optimize Prompt</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
