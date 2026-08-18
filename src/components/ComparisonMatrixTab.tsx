import React, { useState } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  Trophy,
  Info,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { DecisionAnalysisResult, MatrixCriterion } from "../types";

interface ComparisonMatrixTabProps {
  analysis: DecisionAnalysisResult;
  userCustomWeights?: Record<string, number>;
  onUpdateWeights?: (weights: Record<string, number>) => void;
}

export const ComparisonMatrixTab: React.FC<ComparisonMatrixTabProps> = ({
  analysis,
  userCustomWeights,
  onUpdateWeights,
}) => {
  const matrix = analysis.comparisonMatrix;

  // Initialize local weights with user's overrides or AI defaults
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    matrix.criteria.forEach((c) => {
      initial[c.id] = userCustomWeights?.[c.id] !== undefined ? userCustomWeights[c.id] : c.weight;
    });
    return initial;
  });

  const handleWeightChange = (criteriaId: string, newWeight: number) => {
    const updated = { ...weights, [criteriaId]: newWeight };
    setWeights(updated);
    if (onUpdateWeights) {
      onUpdateWeights(updated);
    }
  };

  const handleResetWeights = () => {
    const reset: Record<string, number> = {};
    matrix.criteria.forEach((c) => {
      reset[c.id] = c.weight;
    });
    setWeights(reset);
    if (onUpdateWeights) {
      onUpdateWeights(reset);
    }
  };

  // Calculate weighted total scores for each option
  // Option ID -> total weighted score
  const optionScores: Record<string, { totalScore: number; maxPossible: number; percentage: number }> = {};
  const totalWeight = Object.values(weights).reduce<number>((a, b) => a + Number(b || 0), 0);

  analysis.optionsAnalysis.forEach((opt) => {
    const optionScoreGroup = matrix.scores.find((s) => s.optionId === opt.optionId);
    let weightedSum = 0;
    const maxWeighted = totalWeight * 10;

    matrix.criteria.forEach((crit) => {
      const scoreObj = optionScoreGroup?.scoresByCriteria.find((s) => s.criteriaId === crit.id);
      const scoreVal = scoreObj?.score || 5;
      const weightVal = weights[crit.id] || 3;
      weightedSum += scoreVal * weightVal;
    });

    const percentage = maxWeighted > 0 ? Math.round((weightedSum / maxWeighted) * 100) : 0;
    optionScores[opt.optionId] = {
      totalScore: weightedSum,
      maxPossible: maxWeighted,
      percentage,
    };
  });

  // Determine current matrix leader based on weights
  let highestScore = -1;
  let leaderOptionId = "";
  Object.entries(optionScores).forEach(([optId, data]) => {
    if (data.totalScore > highestScore) {
      highestScore = data.totalScore;
      leaderOptionId = optId;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Interactive Controls Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">
              Dynamic Weighted Decision Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Adjust the importance slider for any criterion. Scores recalculate in real time to show how changing priorities shift the leader!
          </p>
        </div>

        <button
          onClick={handleResetWeights}
          className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 self-start sm:self-auto border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to AI Weights</span>
        </button>
      </div>

      {/* Leaderboard banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {analysis.optionsAnalysis.map((opt) => {
          const scoreData = optionScores[opt.optionId] || { totalScore: 0, maxPossible: totalWeight * 10 || 10, percentage: 0 };
          const isLeader = opt.optionId === leaderOptionId;

          return (
            <div
              key={opt.optionId}
              className={`p-4 rounded-xl border transition-all ${
                isLeader
                  ? "bg-indigo-50/50 border-indigo-300 shadow-xs ring-1 ring-indigo-400/40"
                  : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-slate-900 text-sm truncate">
                  {opt.optionName}
                </span>
                {isLeader && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                    <Trophy className="w-2.5 h-2.5" />
                    <span>Leader</span>
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {scoreData.percentage}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({scoreData.totalScore} pts)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLeader ? "bg-indigo-600" : "bg-slate-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, scoreData.percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-800 w-1/4">
                  Evaluation Criterion
                </th>
                <th className="py-3 px-4 font-semibold text-slate-800 w-44">
                  Importance Weight (1-5)
                </th>
                {analysis.optionsAnalysis.map((opt) => (
                  <th key={opt.optionId} className="py-3 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span>{opt.optionName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {matrix.criteria.map((crit) => {
                const currentWeight = weights[crit.id] || 3;

                return (
                  <tr key={crit.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Criterion info */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-900">{crit.name}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {crit.description}
                      </p>
                    </td>

                    {/* Weight Slider */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Weight:</span>
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-indigo-700 border border-slate-200">
                            {currentWeight}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={currentWeight}
                          onChange={(e) => handleWeightChange(crit.id, parseInt(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Low</span>
                          <span>Crucial</span>
                        </div>
                      </div>
                    </td>

                    {/* Option Scores & AI Justifications */}
                    {analysis.optionsAnalysis.map((opt) => {
                      const scoreGroup = matrix.scores.find((s) => s.optionId === opt.optionId);
                      const itemScore = scoreGroup?.scoresByCriteria.find(
                        (s) => s.criteriaId === crit.id
                      );
                      const scoreValue = itemScore?.score || 5;

                      // Score color coding
                      const getScoreBadge = (val: number) => {
                        if (val >= 8) return "bg-emerald-50 text-emerald-800 border-emerald-200";
                        if (val >= 6) return "bg-indigo-50 text-indigo-800 border-indigo-200";
                        return "bg-rose-50 text-rose-800 border-rose-200";
                      };

                      return (
                        <td key={opt.optionId} className="py-3.5 px-4 align-top">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${getScoreBadge(
                                scoreValue
                              )}`}
                            >
                              {scoreValue}/10
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Weighted: {(scoreValue * currentWeight)} pts
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200">
                            {itemScore?.justification || "No justification provided."}
                          </p>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>

            {/* Total Weighted Score Footer */}
            <tfoot className="bg-slate-900 text-white font-semibold">
              <tr>
                <td className="py-3.5 px-4">
                  <div className="text-sm font-bold">Total Composite Score</div>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Normalized against current criteria weights
                  </p>
                </td>
                <td className="py-3.5 px-4 text-xs font-mono text-indigo-300">
                  Total Weight: {totalWeight}x
                </td>
                {analysis.optionsAnalysis.map((opt) => {
                  const scoreData = optionScores[opt.optionId] || { totalScore: 0, maxPossible: totalWeight * 10 || 10, percentage: 0 };
                  const isLeader = opt.optionId === leaderOptionId;

                  return (
                    <td key={opt.optionId} className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white font-mono">
                          {scoreData.percentage}%
                        </span>
                        {isLeader && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                            1st
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {scoreData.totalScore} / {scoreData.maxPossible} max pts
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
