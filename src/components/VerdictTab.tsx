import React, { useState } from "react";
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Calendar,
  ThumbsUp,
  Flame,
  Check,
  Eye,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DecisionAnalysisResult } from "../types";

interface VerdictTabProps {
  analysis: DecisionAnalysisResult;
  onExploreProsCons: () => void;
  onExploreMatrix: () => void;
  onOpenSecondOpinion?: () => void;
}

export const VerdictTab: React.FC<VerdictTabProps> = ({
  analysis,
  onExploreProsCons,
  onExploreMatrix,
  onOpenSecondOpinion,
}) => {
  const verdict = analysis.tiebreakerVerdict;
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((i) => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d97706", "#b45309", "#1c1917", "#fbbf24", "#059669"],
    });
    setHasCelebrated(true);
  };

  const winningOptionAnalysis = analysis.optionsAnalysis.find(
    (o) => o.optionId === verdict.winnerOptionId || o.optionName.toLowerCase() === verdict.winnerOptionName.toLowerCase()
  ) || analysis.optionsAnalysis[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Executive Summary Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Strategic Synthesis</span>
        </div>
        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* The Tiebreaker Winner Spotlight */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Recommended Winner</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Confidence Rating:</span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>{verdict.confidenceScore}%</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            {verdict.winnerOptionName}
          </h2>

          <p className="text-indigo-200 font-medium text-base sm:text-lg mb-6 leading-snug">
            "{verdict.headlineVerdict}"
          </p>

          {/* Key Rationales */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800 mb-6">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Why This Option Breaks the Tie
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {verdict.keyRationale.map((rationale, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>{rationale}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-400">
              Optimal match for your weighted priorities and risk profile.
            </p>

            <button
              onClick={handleCelebrate}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{hasCelebrated ? "Verdict Accepted! 🎉" : "Accept Verdict"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Devil's Advocate & Gut Check */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Devil's Advocate Box */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Devil's Advocate Stress-Test</span>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base mb-2">
              The Strongest Counter-Argument
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 mb-4 bg-rose-50/70 p-3 rounded-lg border border-rose-100 italic">
              "{verdict.devilsAdvocate.counterArgument}"
            </p>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-1 text-emerald-700">
              Why the Verdict Still Holds
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
              {verdict.devilsAdvocate.whyVerdictStillHolds}
            </p>
          </div>
        </div>

        {/* Psychological Gut-Check Box */}
        <div className="bg-indigo-50/40 rounded-xl border border-indigo-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold uppercase tracking-wider mb-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Intuition & Subconscious Gut-Check</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">
              The Disappointment Metric
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-4 rounded-lg border border-indigo-100 mb-4 shadow-xs">
              {verdict.gutCheckQuestion}
            </p>
          </div>
          <div className="pt-2 text-xs text-indigo-900">
            <span className="font-semibold">Rule of thumb:</span> If reading this verdict brought relief, you have your answer. If it caused hesitation, examine which specific trade-off is blocking you.
          </div>
        </div>
      </div>

      {/* 7-Day Action Plan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Next Steps: 7-Day Implementation Plan
            </h3>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500">
            {completedSteps.length}/{verdict.actionPlan.length} completed
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Indecision is broken by momentum. Take these concrete actions to initiate your choice:
        </p>

        <div className="space-y-2.5">
          {verdict.actionPlan.map((step, idx) => {
            const isDone = completedSteps.includes(idx);
            return (
              <div
                key={idx}
                onClick={() => toggleStep(idx)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  isDone
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                    : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-800"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${
                    isDone
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-300 text-transparent hover:border-slate-400"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Step {idx + 1}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm mt-0.5 ${isDone ? "line-through text-slate-400" : "font-medium"}`}>
                    {step}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Second Opinion & Bias Audit Callout */}
      {onOpenSecondOpinion && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-sm sm:text-base text-white">
                  Feeling Doubt or Sunk-Cost Attachment?
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-400/20 text-purple-200 border border-purple-300/30">
                  Bias Audit
                </span>
              </div>
              <p className="text-xs text-indigo-200 max-w-xl leading-relaxed">
                Trigger a deep cognitive audit to uncover hidden assumptions, false dichotomies, and psychological blind spots in this decision.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSecondOpinion}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer flex-shrink-0"
          >
            <Eye className="w-4 h-4 text-indigo-700" />
            <span>Get a Second Opinion</span>
          </button>
        </div>
      )}

      {/* Quick Jump Buttons to Dive Deeper */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <span className="text-xs text-slate-500 font-medium">Want to inspect the underlying data?</span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onExploreProsCons}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Inspect Pros & Cons</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
          </button>
          <button
            onClick={onExploreMatrix}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Adjust Criteria Weights</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
