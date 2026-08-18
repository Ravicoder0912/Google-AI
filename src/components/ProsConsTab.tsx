import React, { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Plus,
  Trash2,
  ShieldCheck,
  Tag,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Heart,
} from "lucide-react";
import {
  DecisionAnalysisResult,
  OptionAnalysis,
  ProItem,
  ConItem,
  GutFeelingRecord,
} from "../types";
import { GutFeelingSection, GUT_FEELING_CONFIG } from "./GutFeelingSection";

interface ProsConsTabProps {
  analysis: DecisionAnalysisResult;
  onUpdateOptionData?: (updatedAnalysis: DecisionAnalysisResult) => void;
  userGutFeelings?: GutFeelingRecord;
  onUpdateGutFeelings?: (updatedGutFeelings: GutFeelingRecord) => void;
}

export const ProsConsTab: React.FC<ProsConsTabProps> = ({
  analysis,
  onUpdateOptionData,
  userGutFeelings = {},
  onUpdateGutFeelings,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    analysis.optionsAnalysis[0]?.optionId || ""
  );
  const [isAddingPro, setIsAddingPro] = useState(false);
  const [isAddingCon, setIsAddingCon] = useState(false);

  // New item draft states
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newImpact, setNewImpact] = useState<"high" | "medium" | "low">("medium");
  const [newMitigation, setNewMitigation] = useState("");

  const activeOption =
    analysis.optionsAnalysis.find((o) => o.optionId === selectedOptionId) ||
    analysis.optionsAnalysis[0];

  // Calculate scores
  const calculateOptionScore = (opt: OptionAnalysis) => {
    const prosTotal = opt.pros.reduce((acc, p) => acc + (p.score || 3), 0);
    const consTotal = opt.cons.reduce((acc, c) => acc + (c.score || -3), 0);
    return { prosTotal, consTotal, netScore: prosTotal + consTotal };
  };

  const handleAddCustomPro = () => {
    if (!newText.trim()) return;
    const impactScoreMap = { high: 5, medium: 3, low: 1 };
    const newPro: ProItem = {
      id: `custom-pro-${Date.now()}`,
      text: newText.trim(),
      category: newCategory.trim() || "Personal Value",
      impact: newImpact,
      score: impactScoreMap[newImpact],
    };

    const updatedOptions = analysis.optionsAnalysis.map((opt) => {
      if (opt.optionId === activeOption.optionId) {
        return { ...opt, pros: [...opt.pros, newPro] };
      }
      return opt;
    });

    if (onUpdateOptionData) {
      onUpdateOptionData({ ...analysis, optionsAnalysis: updatedOptions });
    }
    setNewText("");
    setIsAddingPro(false);
  };

  const handleAddCustomCon = () => {
    if (!newText.trim()) return;
    const severityScoreMap = { high: -5, medium: -3, low: -1 };
    const newCon: ConItem = {
      id: `custom-con-${Date.now()}`,
      text: newText.trim(),
      category: newCategory.trim() || "Risk & Liability",
      severity: newImpact,
      score: severityScoreMap[newImpact],
      mitigation: newMitigation.trim() || "Set clear boundaries and review periodically.",
    };

    const updatedOptions = analysis.optionsAnalysis.map((opt) => {
      if (opt.optionId === activeOption.optionId) {
        return { ...opt, cons: [...opt.cons, newCon] };
      }
      return opt;
    });

    if (onUpdateOptionData) {
      onUpdateOptionData({ ...analysis, optionsAnalysis: updatedOptions });
    }
    setNewText("");
    setNewMitigation("");
    setIsAddingCon(false);
  };

  const handleDeletePro = (optId: string, proId: string) => {
    const updatedOptions = analysis.optionsAnalysis.map((opt) => {
      if (opt.optionId === optId) {
        return { ...opt, pros: opt.pros.filter((p) => p.id !== proId) };
      }
      return opt;
    });
    if (onUpdateOptionData) {
      onUpdateOptionData({ ...analysis, optionsAnalysis: updatedOptions });
    }
  };

  const handleDeleteCon = (optId: string, conId: string) => {
    const updatedOptions = analysis.optionsAnalysis.map((opt) => {
      if (opt.optionId === optId) {
        return { ...opt, cons: opt.cons.filter((c) => c.id !== conId) };
      }
      return opt;
    });
    if (onUpdateOptionData) {
      onUpdateOptionData({ ...analysis, optionsAnalysis: updatedOptions });
    }
  };

  const activeGut = userGutFeelings[activeOption.optionId];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Option Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {analysis.optionsAnalysis.map((opt) => {
            const isSelected = opt.optionId === activeOption.optionId;
            const { netScore } = calculateOptionScore(opt);
            const isWinner =
              opt.optionId === analysis.tiebreakerVerdict.winnerOptionId ||
              opt.optionName.toLowerCase() === analysis.tiebreakerVerdict.winnerOptionName.toLowerCase();
            const gut = userGutFeelings[opt.optionId];

            return (
              <button
                key={opt.optionId}
                onClick={() => setSelectedOptionId(opt.optionId)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {isWinner && <Award className="w-3.5 h-3.5 text-indigo-200" />}
                <span>{opt.optionName}</span>
                {gut && (
                  <span className="text-[11px]" title={`Gut feeling: ${GUT_FEELING_CONFIG[gut.feeling].label}`}>
                    {GUT_FEELING_CONFIG[gut.feeling].emoji}
                  </span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected
                      ? "bg-indigo-700 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  Net: {netScore > 0 ? `+${netScore}` : netScore}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="hidden sm:inline">Active View:</span>
          <span className="font-semibold text-slate-800">{activeOption.optionName}</span>
        </div>
      </div>

      {/* Option Summary Card */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeOption.optionName}
            </h2>
            {activeOption.optionId === analysis.tiebreakerVerdict.winnerOptionId && (
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Winner
              </span>
            )}
            {activeGut && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 border ${GUT_FEELING_CONFIG[activeGut.feeling].bgClass} ${GUT_FEELING_CONFIG[activeGut.feeling].textClass} ${GUT_FEELING_CONFIG[activeGut.feeling].borderClass}`}
              >
                <span>{GUT_FEELING_CONFIG[activeGut.feeling].emoji}</span>
                <span>{GUT_FEELING_CONFIG[activeGut.feeling].shortLabel}</span>
              </span>
            )}
          </div>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {activeOption.tagline}
          </p>
          <div className="mt-2 text-xs text-indigo-200 font-medium">
            🎯 <span className="text-slate-400">Best for:</span> {activeOption.bestFor}
          </div>
        </div>

        {/* Score Summary Metrics */}
        {(() => {
          const { prosTotal, consTotal, netScore } = calculateOptionScore(activeOption);
          return (
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700 text-center flex-shrink-0 font-mono">
              <div className="px-2">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">Pros</div>
                <div className="text-base font-bold text-emerald-300">+{prosTotal}</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="px-2">
                <div className="text-[10px] uppercase tracking-widest text-rose-400 font-semibold">Cons</div>
                <div className="text-base font-bold text-rose-300">{consTotal}</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="px-2">
                <div className="text-[10px] uppercase tracking-widest text-indigo-300 font-semibold">Net Index</div>
                <div className={`text-base font-bold ${netScore >= 0 ? "text-indigo-300" : "text-rose-400"}`}>
                  {netScore > 0 ? `+${netScore}` : netScore}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Side-by-Side Pros and Cons Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PROS COLUMN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Pros & Strategic Advantages
                  </h3>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {activeOption.pros.length} key strengths identified
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAddingPro(!isAddingPro)}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 border border-emerald-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pro</span>
              </button>
            </div>

            {/* Inline Add Pro Form */}
            {isAddingPro && (
              <div className="mb-4 p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-2.5 animate-in fade-in">
                <div className="text-xs font-bold text-emerald-900">Add Custom Pro Item</div>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Free daily meals and onsite gym saves ~$400/mo"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-emerald-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Category</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category (e.g. Financial, Culture)"
                      className="w-full px-2.5 py-1 text-xs rounded-md border border-emerald-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Impact Weight</label>
                    <select
                      value={newImpact}
                      onChange={(e) => setNewImpact(e.target.value as any)}
                      className="w-full px-2 py-1 text-xs rounded-md border border-emerald-200 bg-white"
                    >
                      <option value="high">High (+5)</option>
                      <option value="medium">Medium (+3)</option>
                      <option value="low">Low (+1)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingPro(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomPro}
                    disabled={!newText.trim()}
                    className="px-3 py-1 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-md disabled:opacity-40"
                  >
                    Save Pro
                  </button>
                </div>
              </div>
            )}

            {/* Pros List */}
            <div className="space-y-3">
              {activeOption.pros.map((pro) => {
                const impactStyles = {
                  high: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
                  medium: "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium",
                  low: "bg-slate-100 text-slate-700 border-slate-200 font-normal",
                }[pro.impact] || "bg-emerald-50 text-emerald-800";

                return (
                  <div
                    key={pro.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                        {pro.text}
                      </p>
                      {onUpdateOptionData && (
                        <button
                          onClick={() => handleDeletePro(activeOption.optionId, pro.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{pro.category}</span>
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${impactStyles}`}>
                        {pro.impact} impact (+{pro.score})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONS COLUMN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center">
                  <ThumbsDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Cons, Risks & Trade-Offs
                  </h3>
                  <span className="text-[11px] text-rose-700 font-medium">
                    {activeOption.cons.length} potential friction points
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAddingCon(!isAddingCon)}
                className="text-xs font-medium text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 border border-rose-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Con</span>
              </button>
            </div>

            {/* Inline Add Con Form */}
            {isAddingCon && (
              <div className="mb-4 p-3.5 rounded-lg bg-rose-50/70 border border-rose-200 space-y-2.5 animate-in fade-in">
                <div className="text-xs font-bold text-rose-900">Add Custom Con Item</div>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Higher commute time of 45 mins each way"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-rose-300 bg-white focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Category</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category (e.g. Time, Cost)"
                      className="w-full px-2.5 py-1 text-xs rounded-md border border-rose-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Severity</label>
                    <select
                      value={newImpact}
                      onChange={(e) => setNewImpact(e.target.value as any)}
                      className="w-full px-2 py-1 text-xs rounded-md border border-rose-200 bg-white"
                    >
                      <option value="high">High (-5)</option>
                      <option value="medium">Medium (-3)</option>
                      <option value="low">Low (-1)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Mitigation Strategy</label>
                  <input
                    type="text"
                    value={newMitigation}
                    onChange={(e) => setNewMitigation(e.target.value)}
                    placeholder="How will you mitigate this risk?"
                    className="w-full px-2.5 py-1 text-xs rounded-md border border-rose-200 bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingCon(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomCon}
                    disabled={!newText.trim()}
                    className="px-3 py-1 text-xs font-medium bg-rose-700 hover:bg-rose-800 text-white rounded-md disabled:opacity-40"
                  >
                    Save Con
                  </button>
                </div>
              </div>
            )}

            {/* Cons List */}
            <div className="space-y-3">
              {activeOption.cons.map((con) => {
                const severityStyles = {
                  high: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
                  medium: "bg-rose-50 text-rose-800 border-rose-200 font-medium",
                  low: "bg-slate-100 text-slate-700 border-slate-200 font-normal",
                }[con.severity] || "bg-rose-50 text-rose-800";

                return (
                  <div
                    key={con.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                        {con.text}
                      </p>
                      {onUpdateOptionData && (
                        <button
                          onClick={() => handleDeleteCon(activeOption.optionId, con.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{con.category}</span>
                      </span>

                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${severityStyles}`}>
                        {con.severity} severity ({con.score})
                      </span>
                    </div>

                    {/* Mitigation Strategy */}
                    {con.mitigation && (
                      <div className="mt-2.5 p-2 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 flex items-start gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-900">Mitigation: </span>
                          <span>{con.mitigation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Gut Feeling Input Prompt */}
      {onUpdateGutFeelings && (
        <div className="pt-2">
          <GutFeelingSection
            analysis={analysis}
            userGutFeelings={userGutFeelings}
            onUpdateGutFeelings={onUpdateGutFeelings}
          />
        </div>
      )}
    </div>
  );
};
