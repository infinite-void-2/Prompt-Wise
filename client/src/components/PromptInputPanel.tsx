import React from 'react';
import { ArrowRight, Loader2, Sparkles, Trash2, BookOpen } from 'lucide-react';
import { EXAMPLE_PROMPTS } from '../lib/examples.js';
import { TaskCategory } from '../types/index.js';

interface PromptInputPanelProps {
  rawPrompt: string;
  onPromptChange: (val: string) => void;
  category: TaskCategory;
  onCategoryChange: (cat: TaskCategory) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
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
  selectedModel,
  onModelChange,
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
    <div className="bg-[#FFFFFF] dark:bg-[#1E1F20] rounded-3xl p-4 sm:p-5 border border-[#E0E2E0] dark:border-[#282A2C] transition-all">
      {/* Top Controls: Category, Target Model & Load Example */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5">
            <label htmlFor="category-select" className="text-[11px] font-medium text-[#444746] dark:text-[#9AA0A6]">
              Category:
            </label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as TaskCategory)}
              disabled={isOptimizing}
              className="bg-[#F0F4F9] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] text-xs rounded-full px-3 py-1 border border-[#E0E2E0] dark:border-[#282A2C] focus:outline-none focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#8AB4F8] font-medium transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <label htmlFor="model-select" className="text-[11px] font-medium text-[#444746] dark:text-[#9AA0A6]">
              Model:
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={isOptimizing}
              className="bg-[#F0F4F9] dark:bg-[#131314] text-[#1A73E8] dark:text-[#8AB4F8] text-xs rounded-full px-3 py-1 border border-[#E0E2E0] dark:border-[#282A2C] focus:outline-none focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#8AB4F8] font-medium font-mono transition-colors"
            >
              <optgroup label="NVIDIA Nemotron (⚡ Active · Free & Open-Source)">
                <option value="nvidia/nemotron-3.5-bolt-e4b">Nemotron 3.5 Bolt (⚡ Ultra-Fast / Default)</option>
                <option value="nvidia/nemotron-3-ultra-550b-a55b">Nemotron 3 Ultra 550B (🧠 Flagship)</option>
                <option value="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning">Nemotron Nano Omni 30B (🔬 Reasoning)</option>
              </optgroup>
              <optgroup label="Google Gemini (⚡ Available)">
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (⚡ Ultra-Fast)</option>
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (🚀 Fast & Balanced)</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (🧠 Reasoning)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (🔬 Deep Context)</option>
              </optgroup>
              <optgroup label="OpenAI (Bridge Ready)">
                <option value="gpt-4o">GPT-4o (Omni Flagship)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Cost-Efficient)</option>
                <option value="o3-mini">o3-mini (Reasoning Tier)</option>
              </optgroup>
              <optgroup label="Anthropic (Bridge Ready)">
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Premium Code)</option>
                <option value="claude-3-5-haiku">Claude 3.5 Haiku (Sub-Second)</option>
              </optgroup>
              <optgroup label="DeepSeek (Bridge Ready)">
                <option value="deepseek-chat">DeepSeek-V3 (671B MoE)</option>
                <option value="deepseek-reasoner">DeepSeek-R1 (Open Reasoning)</option>
              </optgroup>
              <optgroup label="Meta / Open Weights">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq LPU)</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#444746] dark:text-[#9AA0A6]" />
          <label htmlFor="example-select" className="text-[11px] font-medium text-[#444746] dark:text-[#9AA0A6]">
            Example:
          </label>
          <select
            id="example-select"
            defaultValue=""
            onChange={handleSelectExample}
            disabled={isOptimizing}
            className="bg-[#F0F4F9] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] text-xs rounded-full px-3 py-1 border border-[#E0E2E0] dark:border-[#282A2C] focus:outline-none focus:ring-1 focus:ring-[#1A73E8] dark:focus:ring-[#8AB4F8] font-medium max-w-[200px] transition-colors"
          >
            <option value="" disabled>
              Select prompt...
            </option>
            {EXAMPLE_PROMPTS.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Gemini-style prompt input capsule */}
      <div className="relative rounded-2xl bg-[#F0F4F9] dark:bg-[#131314] border border-[#E0E2E0] dark:border-[#282A2C] focus-within:border-[#1A73E8] dark:focus-within:border-[#8AB4F8] transition-all p-3">
        <textarea
          id="raw-prompt-input"
          value={rawPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Paste or write your raw prompt here... (e.g. 'Extract name and age as valid JSON with keys name and age without markdown')"
          rows={3}
          disabled={isOptimizing}
          className={`w-full bg-transparent text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] dark:placeholder-[#5F6368] text-sm font-sans focus:outline-none resize-y ${
            isTooLong ? 'text-red-500 dark:text-red-400' : ''
          }`}
        />

        {rawPrompt && !isOptimizing && (
          <button
            onClick={() => onPromptChange('')}
            className="absolute top-2.5 right-2.5 text-[#444746] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] p-1.5 rounded-full hover:bg-[#E0E2E0] dark:hover:bg-[#282A2C] transition-colors"
            title="Clear prompt"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bottom Footer: Character Count & Gemini Optimize Pill Button */}
      <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <span className={`${isTooLong ? 'text-red-500 font-bold' : 'text-[#444746] dark:text-[#9AA0A6]'}`}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()} characters
          </span>
          {isTooLong && (
            <span className="text-red-500 text-[11px]">Exceeds character limit.</span>
          )}
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Progress step indicator */}
          {isOptimizing && progressStep && (
            <div className="flex items-center space-x-2 text-xs text-[#1A73E8] dark:text-[#8AB4F8] font-medium bg-blue-50 dark:bg-[#1E2838] px-3.5 py-1 rounded-full border border-blue-200 dark:border-[#2B3E5A] animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{progressStep}</span>
            </div>
          )}

          <button
            id="optimize-prompt-btn"
            onClick={onOptimize}
            disabled={isEmpty || isTooLong || isOptimizing}
            className={`flex items-center space-x-2 px-5 py-2 rounded-full font-medium text-xs sm:text-sm transition-all ${
              isEmpty || isTooLong || isOptimizing
                ? 'bg-[#E0E2E0] dark:bg-[#282A2C] text-[#747775] dark:text-[#5F6368] cursor-not-allowed'
                : 'bg-[#1A73E8] hover:bg-[#1B66CA] dark:bg-gradient-to-r dark:from-[#1A73E8] dark:via-[#1B66CA] dark:to-[#8AB4F8] text-white active:scale-[0.98]'
            }`}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Optimize Prompt</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
