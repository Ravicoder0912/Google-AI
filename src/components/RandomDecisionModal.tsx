import React from "react";
import { X, Dices } from "lucide-react";
import { RandomizerTab } from "./RandomizerTab";

interface RandomDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  options?: Array<{ id: string; name: string }>;
  decisionTitle?: string;
  onSelectOption?: (chosenName: string) => void;
}

export const RandomDecisionModal: React.FC<RandomDecisionModalProps> = ({
  isOpen,
  onClose,
  options,
  decisionTitle,
  onSelectOption,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                The Tiebreaker Random Decision Tool
              </h3>
              <p className="text-xs text-slate-500">
                Wheel Spin & Coin Flip with Freud-Kahneman Subconscious Analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <RandomizerTab
          initialOptions={options}
          decisionTitle={decisionTitle}
          onCommitChoice={(chosen) => {
            if (onSelectOption) onSelectOption(chosen);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
