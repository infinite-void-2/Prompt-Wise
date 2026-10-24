import React from 'react';
import { X, Check, Cpu, Zap, Brain, Sparkles, Layers } from 'lucide-react';
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
  if (!isOpen) return null;

  const providers = [
    { key: 'nvidia', name: 'NVIDIA Nemotron (Free & Open Source - Active)', icon: Zap, color: 'emerald' },
    { key: 'google', name: 'Google Gemini', icon: Sparkles, color: 'emerald' },
    { key: 'openai', name: 'OpenAI', icon: Brain, color: 'blue' },
    { key: 'anthropic', name: 'Anthropic Claude', icon: Layers, color: 'amber' },
    { key: 'deepseek', name: 'DeepSeek', icon: Cpu, color: 'indigo' },
    { key: 'meta', name: 'Meta / Groq', icon: Zap, color: 'purple' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Select AI Model for Prompting</h3>
              <p className="text-xs text-slate-400">Choose your optimization & execution target model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Grouped by Provider */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {providers.map((p) => {
            const models = SUPPORTED_MODELS.filter((m) => m.provider === p.key);
            if (models.length === 0) return null;

            return (
              <div key={p.key} className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <p.icon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{p.name}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {models.map((model: ModelInfo) => {
                    const isSelected = selectedModel === model.id;

                    return (
                      <div
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          onClose();
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-white text-xs block">{model.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{model.id}</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                          {model.description}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 font-medium">
                            {model.badge}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {model.inputPrice}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Active Selection: <strong className="text-emerald-400 font-mono">{selectedModel}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
