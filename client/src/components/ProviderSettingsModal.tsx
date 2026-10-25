import React, { useState } from 'react';
import { X, Key, CheckCircle2, Shield, Info } from 'lucide-react';
import { ServiceHealth } from '../types/index.js';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: ServiceHealth | null;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  health,
}) => {
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('optiprompt_openai_key') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('optiprompt_anthropic_key') || '');
  const [deepseekKey, setDeepseekKey] = useState(() => localStorage.getItem('optiprompt_deepseek_key') || '');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('optiprompt_groq_key') || '');
  const [savedNotice, setSavedNotice] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('optiprompt_openai_key', openaiKey.trim());
    localStorage.setItem('optiprompt_anthropic_key', anthropicKey.trim());
    localStorage.setItem('optiprompt_deepseek_key', deepseekKey.trim());
    localStorage.setItem('optiprompt_groq_key', groqKey.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-[#1E1F20] border border-[#3C4043] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#282A2C] flex items-center justify-between bg-[#131314]/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E2E25] text-[#81C995] flex items-center justify-center border border-[#2E573D]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 id="provider-modal-title" className="text-base font-bold text-white">Multi-Model Provider Keys</h3>
              <p className="text-xs text-[#9AA0A6]">Configure or view upstream AI credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close provider keys modal"
            className="text-[#9AA0A6] hover:text-white p-1.5 rounded-lg hover:bg-[#282A2C] transition-colors focus-visible:ring-2 focus-visible:ring-[#8AB4F8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {/* Informational Bridge Banner */}
          <div className="p-3.5 rounded-xl bg-[#1E2E25] border border-[#2E573D] text-[#81C995] flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-[#81C995] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Zero-Key Frictionless Multi-Model Mode</p>
              <p className="text-[11px] text-[#C4C7C5] leading-relaxed">
                You can select and test prompts with <strong>OpenAI, Anthropic, DeepSeek, and Llama</strong> immediately! When API keys are not yet provided, PromptWise automatically activates its multi-model bridge engine so you can benchmark prompt behaviors right away.
              </p>
            </div>
          </div>

          {/* Provider List */}
          <div className="space-y-4">
            {/* 1. NVIDIA Nemotron */}
            <div className="p-3.5 rounded-xl bg-[#1E2E25]/60 border border-[#2E573D] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">NVIDIA Nemotron</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#1E2E25] text-[#81C995] text-[10px] font-semibold border border-[#2E573D]">
                    Active · Free & Open Source
                  </span>
                </div>
                <p className="text-[#9AA0A6] text-[11px]">NVIDIA NIM Server Key Connected · Models: Nemotron 3.5 Bolt, Nemotron 550B, Nano Omni</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#81C995] flex-shrink-0" />
            </div>

            {/* 2. Google Gemini */}
            <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282A2C] flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Google Gemini</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#282A2C] text-[#C4C7C5] text-[10px] font-semibold">
                    {health?.providers?.google ? 'Connected' : 'Fallback / Rate Limited'}
                  </span>
                </div>
                <p className="text-[#9AA0A6] text-[11px]">Server key configured · Models: 3.5 Flash-Lite, 3.5 Flash, 3.8 Flash, 2.5 Pro</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#81C995] flex-shrink-0" />
            </div>

            {/* 3. OpenAI */}
            <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282A2C] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">OpenAI</span>
                  <span className="text-[#9AA0A6] text-[11px]">(GPT-4o, GPT-4o Mini, o3-mini)</span>
                </div>
                <span className="text-[10px] text-[#9AA0A6]">Optional</span>
              </div>
              <input
                type="password"
                placeholder="sk-proj-... (or set OPENAI_API_KEY in server/.env)"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                aria-label="OpenAI API Key"
                className="w-full bg-[#1E1F20] border border-[#3C4043] text-[#E3E3E3] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#8AB4F8] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#8AB4F8]"
              />
            </div>

            {/* 4. Anthropic */}
            <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282A2C] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Anthropic</span>
                  <span className="text-[#9AA0A6] text-[11px]">(Claude 3.5 Sonnet, Claude 3.5 Haiku)</span>
                </div>
                <span className="text-[10px] text-[#9AA0A6]">Optional</span>
              </div>
              <input
                type="password"
                placeholder="sk-ant-... (or set ANTHROPIC_API_KEY in server/.env)"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                aria-label="Anthropic API Key"
                className="w-full bg-[#1E1F20] border border-[#3C4043] text-[#E3E3E3] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#8AB4F8] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#8AB4F8]"
              />
            </div>

            {/* 5. DeepSeek */}
            <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282A2C] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">DeepSeek</span>
                  <span className="text-[#9AA0A6] text-[11px]">(DeepSeek-V3, DeepSeek-R1)</span>
                </div>
                <span className="text-[10px] text-[#9AA0A6]">Optional</span>
              </div>
              <input
                type="password"
                placeholder="sk-... (or set DEEPSEEK_API_KEY in server/.env)"
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                aria-label="DeepSeek API Key"
                className="w-full bg-[#1E1F20] border border-[#3C4043] text-[#E3E3E3] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#8AB4F8] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#8AB4F8]"
              />
            </div>

            {/* 6. Meta / Groq */}
            <div className="p-3.5 rounded-xl bg-[#131314] border border-[#282A2C] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">Meta / Groq LPU</span>
                  <span className="text-[#9AA0A6] text-[11px]">(Llama 3.3 70B)</span>
                </div>
                <span className="text-[10px] text-[#9AA0A6]">Optional</span>
              </div>
              <input
                type="password"
                placeholder="gsk_... (or set GROQ_API_KEY in server/.env)"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                aria-label="Groq API Key"
                className="w-full bg-[#1E1F20] border border-[#3C4043] text-[#E3E3E3] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#8AB4F8] font-mono text-xs focus-visible:ring-1 focus-visible:ring-[#8AB4F8]"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#282A2C] bg-[#131314] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-[#9AA0A6]">
            <Shield className="w-3.5 h-3.5 text-[#81C995]" />
            <span>Keys stored securely in your local environment</span>
          </div>
          <div className="flex items-center space-x-2">
            {savedNotice && (
              <span className="text-xs text-[#81C995] font-medium animate-fadeIn">
                Saved successfully!
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1A73E8] hover:bg-[#1B66CA] text-white transition-all shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-[#8AB4F8]"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
