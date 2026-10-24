import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Sparkles, Edit2, Check } from 'lucide-react';
import { ServiceHealth } from '../types/index.js';

interface HeaderProps {
  appName: string;
  onUpdateAppName: (name: string) => void;
  health: ServiceHealth | null;
  healthLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  onUpdateAppName,
  health,
  healthLoading,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(appName);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateAppName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Configurable Name */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              {isEditingName ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="bg-slate-800 text-white text-lg font-bold px-2 py-0.5 rounded border border-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    title="Save name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 group">
                  <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    {appName}
                  </h1>
                  <button
                    onClick={() => {
                      setTempName(appName);
                      setIsEditingName(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-200"
                    title="Rename application"
                    id="rename-app-btn"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Gemini Native Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Prompt Optimization & Token Efficiency Engine
            </p>
          </div>
        </div>

        {/* Server & Model Status */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-mono text-emerald-400 font-medium">
              {health ? health.model : 'gemini-2.5-flash'}
            </span>
          </div>

          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-medium ${
              health?.hasApiKey
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : healthLoading
                ? 'bg-slate-800/60 border-slate-700 text-slate-400'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            {health?.hasApiKey ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>API Connected</span>
              </>
            ) : healthLoading ? (
              <span>Checking...</span>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Mock / Key Required</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
