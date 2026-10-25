import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Sparkles, Edit2, Check, ChevronDown, Key } from 'lucide-react';
import { ServiceHealth } from '../types/index.js';
import { ModelSelectorModal } from './ModelSelectorModal.js';
import { ProviderSettingsModal } from './ProviderSettingsModal.js';
import { SUPPORTED_MODELS } from '../lib/models.js';

interface HeaderProps {
  appName: string;
  onUpdateAppName: (name: string) => void;
  health: ServiceHealth | null;
  healthLoading: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  appName,
  onUpdateAppName,
  health,
  healthLoading,
  selectedModel,
  onSelectModel,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(appName);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const currentModelInfo = SUPPORTED_MODELS.find((m) => m.id === selectedModel);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateAppName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <>
      <header className="border-b border-[#282a2c] bg-[#1e1f20]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Configurable Name */}
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#8ab4f8] to-[#c58af9] flex items-center justify-center shadow-md">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                {isEditingName ? (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      className="bg-[#282a2c] text-white text-base font-medium px-2.5 py-1 rounded-xl border border-[#8ab4f8] focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1b66ca] text-white transition-colors"
                      title="Save name"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 group">
                    <h1 className="text-base sm:text-lg font-medium tracking-normal text-[#e3e3e3] flex items-center gap-1.5">
                      {appName}
                    </h1>
                    <button
                      onClick={() => {
                        setTempName(appName);
                        setIsEditingName(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9aa0a6] hover:text-[#e3e3e3] p-1 rounded-full hover:bg-[#282a2c]"
                      title="Rename application"
                      id="rename-app-btn"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#282a2c] text-[#8ab4f8] font-medium border border-[#3c4043]/50">
                  {currentModelInfo ? currentModelInfo.providerName : 'Multi-Model Engine'}
                </span>
              </div>
              <p className="text-[11px] text-[#9aa0a6] hidden sm:block">
                Prompt Optimization & Token Efficiency Engine
              </p>
            </div>
          </div>

          {/* Controls: Interactive Model Selector & Provider Status */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            {/* Interactive Model Selector Button */}
            <button
              onClick={() => setIsModelModalOpen(true)}
              id="model-selector-btn"
              title="Click to switch AI Model"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#3c4043] border border-[#3c4043]/60 transition-all text-[#e3e3e3] shadow-sm group"
            >
              <Cpu className="w-3.5 h-3.5 text-[#8ab4f8]" />
              <span className="text-[#9aa0a6] hidden md:inline">Model:</span>
              <span className="font-mono text-[#8ab4f8] font-medium text-xs">
                {currentModelInfo ? currentModelInfo.name : selectedModel}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-[#e3e3e3] transition-colors" />
            </button>

            {/* Provider Credentials Button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              id="provider-keys-btn"
              title="Configure API Keys & View Providers"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#282a2c] hover:bg-[#3c4043] border border-[#3c4043]/60 text-[#c4c7c5] transition-all"
            >
              <Key className="w-3.5 h-3.5 text-[#fdd663]" />
              <span>API Keys</span>
            </button>

            {/* API Connection Health Badge */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
                health?.hasApiKey
                  ? 'bg-[#1e2e25] border-[#2e573d] text-[#81c995]'
                  : healthLoading
                  ? 'bg-[#282a2c] border-[#3c4043] text-[#9aa0a6]'
                  : 'bg-[#3b2b1b] border-[#5e4325] text-[#fdd663]'
              }`}
            >
              {health?.hasApiKey ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#81c995]" />
                  <span>Engine Online</span>
                </>
              ) : healthLoading ? (
                <span>Checking...</span>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[#fdd663]" />
                  <span>Key Required</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Model Selection Modal */}
      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
      />

      {/* Provider API Keys Settings Modal */}
      <ProviderSettingsModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        health={health}
      />
    </>
  );
});

Header.displayName = 'Header';
