import React from "react";
import { Sparkles, History, Plus, Dices, Smartphone } from "lucide-react";

interface HeaderProps {
  onNewDecision: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onOpenRandomizer?: () => void;
  onOpenInstallModal?: () => void;
  historyCount: number;
  hasActiveAnalysis: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewDecision,
  onOpenTemplates,
  onOpenHistory,
  onOpenRandomizer,
  onOpenInstallModal,
  historyCount,
  hasActiveAnalysis,
}) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Brand */}
      <div
        id="brand-header"
        onClick={onNewDecision}
        className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
      >
        <div className="w-7 h-7 sm:w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0">
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white rotate-45"></div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="font-bold text-base sm:text-xl tracking-tight text-slate-800 truncate">
            THE TIEBREAKER
          </span>
          <span className="hidden lg:inline-block text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 shrink-0">
            AI DECISION ENGINE
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {onOpenInstallModal && (
          <button
            id="btn-android-install"
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md transition-colors cursor-pointer shadow-xs"
            title="Install App on Android phone / Download"
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="hidden md:inline">Android App</span>
            <span className="md:hidden">App</span>
          </button>
        )}

        {onOpenRandomizer && (
          <button
            id="btn-randomizer"
            onClick={onOpenRandomizer}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 rounded-md transition-colors cursor-pointer"
            title="Random Choice Wheel & Coin Flip"
          >
            <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
            <span className="hidden md:inline">Spin Wheel</span>
          </button>
        )}

        <button
          id="btn-templates"
          onClick={onOpenTemplates}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer border border-slate-200 sm:border-transparent"
          title="Browse pre-built decision scenarios"
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
          <span className="hidden md:inline">Templates</span>
        </button>

        <button
          id="btn-history"
          onClick={onOpenHistory}
          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors relative cursor-pointer border border-slate-200 sm:border-transparent"
          title="View saved decisions"
        >
          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && (
            <span className="w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold shrink-0">
              {historyCount}
            </span>
          )}
        </button>

        {hasActiveAnalysis && (
          <button
            id="btn-new-decision"
            onClick={onNewDecision}
            className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-indigo-600 text-white rounded-md shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer shrink-0"
            title="Start New Decision"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">New Decision</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>
    </header>
  );
};

