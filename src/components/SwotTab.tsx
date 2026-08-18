import React, { useState } from "react";
import {
  Shield,
  Zap,
  TrendingUp,
  AlertOctagon,
  Sparkles,
  Award,
} from "lucide-react";
import { DecisionAnalysisResult } from "../types";

interface SwotTabProps {
  analysis: DecisionAnalysisResult;
}

export const SwotTab: React.FC<SwotTabProps> = ({ analysis }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    analysis.optionsAnalysis[0]?.optionId || ""
  );

  const activeOption =
    analysis.optionsAnalysis.find((o) => o.optionId === selectedOptionId) ||
    analysis.optionsAnalysis[0];

  const swot = activeOption.swot;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Option Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {analysis.optionsAnalysis.map((opt) => {
            const isSelected = opt.optionId === activeOption.optionId;
            const isWinner =
              opt.optionId === analysis.tiebreakerVerdict.winnerOptionId ||
              opt.optionName.toLowerCase() === analysis.tiebreakerVerdict.winnerOptionName.toLowerCase();

            return (
              <button
                key={opt.optionId}
                onClick={() => setSelectedOptionId(opt.optionId)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {isWinner && <Award className="w-3.5 h-3.5 text-indigo-200" />}
                <span>{opt.optionName}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500">
          Viewing SWOT Matrix for: <span className="font-semibold text-slate-800">{activeOption.optionName}</span>
        </div>
      </div>

      {/* Subheader */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            {activeOption.optionName} — SWOT Profile
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {activeOption.tagline}
          </p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
          🎯 Best for: <span className="font-semibold text-slate-900">{activeOption.bestFor}</span>
        </div>
      </div>

      {/* 2x2 SWOT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. STRENGTHS (Internal, Positive) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Strengths (Internal Advantages)
                </h4>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Inherent assets, capabilities, and guaranteed advantages
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {swot.strengths.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                    S{idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. WEAKNESSES (Internal, Negative) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Weaknesses (Internal Limitations)
                </h4>
                <p className="text-[11px] text-rose-700 font-medium">
                  Inherent trade-offs, resource constraints, and drawbacks
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {swot.weaknesses.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                    W{idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. OPPORTUNITIES (External, Positive) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Opportunities (External Upside)
                </h4>
                <p className="text-[11px] text-indigo-700 font-medium">
                  Future doors, compound potential, and market tailwinds
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {swot.opportunities.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                    O{idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. THREATS (External, Negative) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Threats (External Vulnerabilities)
                </h4>
                <p className="text-[11px] text-amber-700 font-medium">
                  Market risks, macro changes, and external dependencies
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {swot.threats.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                    T{idx + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
