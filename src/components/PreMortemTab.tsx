import React, { useState } from "react";
import {
  Skull,
  ShieldCheck,
  Coins,
  Sparkles,
  HelpCircle,
  RotateCcw,
  HeartHandshake,
} from "lucide-react";
import confetti from "canvas-confetti";
import { DecisionAnalysisResult } from "../types";

interface PreMortemTabProps {
  analysis: DecisionAnalysisResult;
}

export const PreMortemTab: React.FC<PreMortemTabProps> = ({ analysis }) => {
  // Coin flip state
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<"heads" | "tails" | null>(null);
  const [flipCount, setFlipCount] = useState(0);

  const optA = analysis.optionsAnalysis[0] || { optionName: "Option A" };
  const optB = analysis.optionsAnalysis[1] || { optionName: "Option B" };

  const handleFlipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setCoinResult(null);

    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? "heads" : "tails";
      setCoinResult(outcome);
      setIsFlipping(false);
      setFlipCount((prev) => prev + 1);

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ["#6366f1", "#4f46e5", "#818cf8"],
      });
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* SECTION 1: Pre-Mortem Failure Analysis */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Skull className="w-5 h-5 text-slate-700" />
          <h2 className="font-bold text-slate-900 text-lg sm:text-xl">
            Pre-Mortem Failure Foresight
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          Assume it is 12 months in the future and this decision was an absolute disaster. What was the #1 root cause, and how can you establish safeguards today?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.optionsAnalysis.map((opt) => (
            <div
              key={opt.optionId}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {opt.optionName}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Worst-Case Vector
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-slate-900 text-slate-200 text-xs sm:text-sm leading-relaxed mb-4 border border-slate-800">
                  <span className="text-rose-400 font-semibold block mb-1">
                    💀 1-Year Failure Scenario:
                  </span>
                  "{opt.preMortem}"
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Proactive Circuit Breaker</span>
                </div>
                <p className="text-slate-600 leading-normal">
                  Schedule a formal 90-day checkpoint. If primary indicators trend toward this risk, trigger an immediate pivot without sunk-cost bias.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: The Psychological Coin Flip & Intuition Test */}
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <Coins className="w-3.5 h-3.5 text-indigo-600" />
            <span>Behavioral Decision Psychology</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            The Freud-Kahneman Intuition Test
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
            When you flip a coin between two choices, you aren’t letting randomness decide.
            The moment the coin is suspended in the air, your subconscious reveals which outcome it is desperately hoping for.
          </p>

          {/* Assigned Choices */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8 text-left">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                Heads
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 truncate">
                {optA.optionName}
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Tails
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 truncate">
                {optB.optionName}
              </div>
            </div>
          </div>

          {/* Animated Coin */}
          <div className="flex flex-col items-center justify-center my-6">
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center font-bold font-mono text-2xl shadow-lg transition-all duration-700 border-4 ${
                coinResult === "heads"
                  ? "bg-indigo-600 border-indigo-700 text-white shadow-indigo-600/20 scale-105"
                  : coinResult === "tails"
                  ? "bg-slate-800 border-slate-900 text-white shadow-slate-800/20 scale-105"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700"
              } ${isFlipping ? "animate-spin scale-110" : ""}`}
            >
              {isFlipping ? "..." : coinResult ? coinResult.toUpperCase() : "FLIP"}
            </div>

            {/* Coin Result Explanation */}
            {coinResult && !isFlipping && (
              <div className="mt-6 p-4 rounded-lg bg-white border border-slate-200 shadow-xs max-w-lg animate-in zoom-in-95">
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
                  The Coin Landed On:
                </div>
                <div className="text-lg font-bold text-slate-900 mb-2">
                  {coinResult === "heads" ? optA.optionName : optB.optionName} ({coinResult.toUpperCase()})
                </div>
                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                  "How did you feel the instant you saw this result? If you felt a burst of relief, that's your true choice. If you felt even a flicker of disappointment, you actually desire the other option."
                </p>
              </div>
            )}
          </div>

          {/* Flip trigger button */}
          <button
            onClick={handleFlipCoin}
            disabled={isFlipping}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium flex items-center gap-2 mx-auto shadow-sm transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
          >
            <Coins className="w-4 h-4 text-indigo-200" />
            <span>{isFlipping ? "Coin in mid-air..." : flipCount === 0 ? "Flip the Coin (Test Intuition)" : "Flip Again"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
