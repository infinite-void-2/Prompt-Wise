import React, { useState } from 'react';
import { X, Check, Cpu, Zap, Brain, Sparkles, Layers, Binary } from 'lucide-react';
import { ModelInfo, SUPPORTED_MODELS } from '../lib/models.js';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}) => {
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('all');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const familyFilters = [
    { id: 'all', label: 'All Families' },
    { id: 'openai-o200k', label: 'OpenAI o200k' },
    { id: 'openai-cl100k', label: 'OpenAI cl100k' },
    { id: 'anthropic-claude', label: 'Anthropic Claude 3' },
    { id: 'llama3-nemotron', label: 'Llama 3 / Nemotron' },
    { id: 'google-gemini', label: 'Google Gemini' },
  ];

  const providers = [
    { key: 'nvidia', name: 'NVIDIA Nemotron (Free & Open Source - Active)', icon: Zap, color: 'emerald' },
    { key: 'google', name: 'Google Gemini', icon: Sparkles, color: 'emerald' },
    { key: 'openai', name: 'OpenAI', icon: Brain, color: 'blue' },
    { key: 'anthropic', name: 'Anthropic Claude', icon: Layers, color: 'amber' },
    { key: 'deepseek', name: 'DeepSeek', icon: Cpu, color: 'indigo' },
    { key: 'meta', name: 'Meta / Groq', icon: Zap, color: 'purple' },
  ];

  const getModelTokenizerBadge = (model: ModelInfo): { label: string; color: string } => {
    const id = model.id.toLowerCase();
    if (id.includes('o200k') || id.includes('gpt-4o') || id.startsWith('o1') || id.startsWith('o3')) {
      return { label: 'o200k_base', color: 'bg-[#1E2E25] text-[#81C995] border-[#2E573D]' };
    }
    if (id.includes('cl100k') || id.includes('gpt-4') || id.includes('gpt-3.5') || id.includes('deepseek')) {
      return { label: 'cl100k_base', color: 'bg-[#1E2838] text-[#8AB4F8] border-[#2B3E5A]' };
    }
    if (id.includes('claude')) {
      return { label: 'Claude BPE', color: 'bg-[#3B2B1B] text-[#FDD663] border-[#5E4325]' };
    }
    if (id.includes('llama') || id.includes('nemotron') || id.startsWith('nvidia/')) {
      return { label: '128k BPE', color: 'bg-[#282038] text-[#C58AF9] border-[#41335A]' };
    }
    return { label: 'Gemini Native', color: 'bg-[#1E2E25] text-[#81C995] border-[#2E573D]' };
  };

  const matchesFamilyFilter = (model: ModelInfo): boolean => {
    if (selectedFamilyFilter === 'all') return true;
    const id = model.id.toLowerCase();
    if (selectedFamilyFilter === 'openai-o200k') {
      return id.includes('o200k') || id.includes('gpt-4o') || id.startsWith('o1') || id.startsWith('o3');
    }
    if (selectedFamilyFilter === 'openai-cl100k') {
      return id.includes('cl100k') || id.includes('gpt-4') || id.includes('gpt-3.5') || id.includes('deepseek');
    }
    if (selectedFamilyFilter === 'anthropic-claude') {
      return id.includes('claude');
    }
    if (selectedFamilyFilter === 'llama3-nemotron') {
      return id.includes('llama') || id.includes('nemotron') || id.startsWith('nvidia/');
    }
    if (selectedFamilyFilter === 'google-gemini') {
      return id.includes('gemini');
    }
    return true;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-[#1E1F20] border border-[#3C4043] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#282A2C] flex items-center justify-between bg-[#131314]/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E2E25] text-[#81C995] flex items-center justify-center border border-[#2E573D]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 id="model-modal-title" className="text-base font-bold text-white">Select AI Model & Tokenizer Family</h3>
              <p className="text-xs text-[#9AA0A6]">Choose your optimization target model and dynamic tokenizer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close model selector modal"
            className="text-[#9AA0A6] hover:text-white p-1.5 rounded-lg hover:bg-[#282A2C] transition-colors focus-visible:ring-2 focus-visible:ring-[#8AB4F8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Family Filter Bar */}
        <div className="px-6 py-2.5 border-b border-[#282A2C] bg-[#131314]/50 flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center text-[#9AA0A6] mr-1 text-[11px] font-medium">
            <Binary className="w-3.5 h-3.5 mr-1 text-[#9AA0A6]" />
            <span>Filter:</span>
          </div>
          {familyFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFamilyFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#8AB4F8] ${
                selectedFamilyFilter === f.id
                  ? 'bg-[#1E2E25] text-[#81C995] border border-[#2E573D] shadow-sm'
                  : 'bg-[#282A2C] text-[#9AA0A6] hover:text-white hover:bg-[#3C4043]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Modal Body: Grouped by Provider */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {providers.map((p) => {
            const models = SUPPORTED_MODELS.filter((m) => m.provider === p.key && matchesFamilyFilter(m));
            if (models.length === 0) return null;

            return (
              <div key={p.key} className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#E3E3E3] uppercase tracking-wider">
                  <p.icon className="w-3.5 h-3.5 text-[#81C995]" />
                  <span>{p.name}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {models.map((model: ModelInfo) => {
                    const isSelected = selectedModel === model.id;
                    const tokenizerBadge = getModelTokenizerBadge(model);

                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(model.id);
                          onClose();
                        }}
                        aria-pressed={isSelected}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 focus-visible:ring-2 focus-visible:ring-[#8AB4F8] ${
                          isSelected
                            ? 'bg-[#1E2E25] border-[#2E573D] shadow-sm ring-1 ring-[#81C995]/50'
                            : 'bg-[#131314] border-[#282A2C] hover:bg-[#282A2C] hover:border-[#3C4043]'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div>
                            <span className="font-bold text-white text-xs block">{model.name}</span>
                            <span className="text-[10px] text-[#9AA0A6] font-mono">{model.id}</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#81C995] flex items-center justify-center text-[#131314]">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-[#C4C7C5] leading-snug line-clamp-2">
                          {model.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-[#282A2C] text-[10px] gap-2 w-full">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-[#282A2C] text-[#C4C7C5] font-medium truncate">
                              {model.badge}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-medium flex-shrink-0 ${tokenizerBadge.color}`}>
                              {tokenizerBadge.label}
                            </span>
                          </div>
                          <span className="text-[#9AA0A6] font-mono text-[10px] flex-shrink-0">
                            {model.inputPrice}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#282A2C] bg-[#131314] flex items-center justify-between text-xs text-[#9AA0A6]">
          <span>Active Selection: <strong className="text-[#81C995] font-mono">{selectedModel}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1B66CA] text-white font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#8AB4F8]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
