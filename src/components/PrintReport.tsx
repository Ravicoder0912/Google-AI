import React from "react";
import {
  Trophy,
  Scale,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Tag,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
} from "lucide-react";
import { DecisionSession, DecisionAnalysisResult } from "../types";
import { GUT_FEELING_CONFIG } from "./GutFeelingSection";

interface PrintReportProps {
  session: DecisionSession;
  analysis: DecisionAnalysisResult;
}

export const PrintReport: React.FC<PrintReportProps> = ({ session, analysis }) => {
  const verdict = analysis.tiebreakerVerdict;
  const weights = session.userCustomWeights || {};

  // Calculate weighted matrix totals for print table
  const matrixCriteria = analysis.comparisonMatrix?.criteria || [];
  const matrixScores = analysis.comparisonMatrix?.scores || [];

  const getOptionMatrixTotal = (optionId: string) => {
    const optScoreObj = matrixScores.find((s) => s.optionId === optionId);
    if (!optScoreObj) return 0;
    return optScoreObj.scoresByCriteria.reduce((sum, item) => {
      const crit = matrixCriteria.find((c) => c.id === item.criteriaId);
      const effectiveWeight = weights[item.criteriaId] !== undefined ? weights[item.criteriaId] : (crit?.weight || 3);
      return sum + item.score * effectiveWeight;
    }, 0);
  };

  const getOptionCriterionScore = (optionId: string, criteriaId: string) => {
    const optScoreObj = matrixScores.find((s) => s.optionId === optionId);
    return optScoreObj?.scoresByCriteria.find((c) => c.criteriaId === criteriaId);
  };

  return (
    <div className="print-report-container text-slate-900 bg-white p-0">
      {/* Print Document Header */}
      <div className="border-b-2 border-slate-900 pb-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-md flex items-center justify-center font-bold text-base">
              T
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
                The Tiebreaker
              </span>
              <span className="text-xs text-slate-500 block">
                Executive Decision Intelligence Report
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Generated: {new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</div>
            <div>Session Date: {new Date(session.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-4 tracking-tight leading-tight">
          {session.title}
        </h1>

        {/* Metadata Pill Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">Options Analyzed:</span>
            <span className="font-semibold text-slate-800">
              {session.options.map((o) => o.name).join(" vs. ")}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">Risk Profile:</span>
            <span className="font-semibold text-slate-800 capitalize">
              {session.riskTolerance || "Balanced"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">Time Horizon:</span>
            <span className="font-semibold text-slate-800 capitalize">
              {(session.timeHorizon || "Medium Term").replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">Priorities:</span>
            <span className="font-semibold text-slate-800">
              {session.priorities && session.priorities.length > 0 ? session.priorities.join(", ") : "Holistic Balance"}
            </span>
          </div>
        </div>

        {session.context && (
          <div className="mt-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Background Context: </span>
            <span>{session.context}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: THE TIEBREAKER VERDICT (Page Break inside avoided) */}
      <section className="mb-8 border border-slate-900 rounded-lg p-5 bg-slate-50/50 break-inside-avoid">
        <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-indigo-700" />
            <h2 className="text-lg font-bold text-slate-950 uppercase tracking-wide">
              Official Recommendation & Verdict
            </h2>
          </div>
          <span className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold font-mono">
            {verdict.confidenceScore}% AI Confidence
          </span>
        </div>

        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest text-indigo-800 font-bold mb-1">
            Recommended Winner:
          </div>
          <div className="text-xl font-black text-slate-950 mb-2">
            {verdict.winnerOptionName}
          </div>
          <blockquote className="border-l-4 border-slate-900 pl-3 py-1 text-sm font-medium text-slate-800 italic bg-white rounded-r">
            "{verdict.headlineVerdict}"
          </blockquote>
        </div>

        {/* Key Rationales */}
        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Strategic Decision Drivers:
          </div>
          <ul className="space-y-1.5 text-xs text-slate-800">
            {verdict.keyRationale.map((rationale, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rationale}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Devil's Advocate & Why Verdict Holds */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="bg-white p-3 rounded border border-rose-200">
            <span className="font-bold text-rose-900 block mb-1">⚠️ Devil's Advocate Challenge:</span>
            <p className="text-slate-700 leading-relaxed">{verdict.devilsAdvocate.counterArgument}</p>
          </div>
          <div className="bg-white p-3 rounded border border-emerald-200">
            <span className="font-bold text-emerald-900 block mb-1">🛡️ Why Verdict Holds:</span>
            <p className="text-slate-700 leading-relaxed">{verdict.devilsAdvocate.whyVerdictStillHolds}</p>
          </div>
        </div>

        {/* 7-Day Implementation Action Plan */}
        {verdict.actionPlan && verdict.actionPlan.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              7-Day Execution Blueprint:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {verdict.actionPlan.map((step, i) => (
                <div key={i} className="bg-white p-2.5 rounded border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block text-[11px] mb-1">Step {i + 1}:</span>
                  <span className="text-slate-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: SIDE-BY-SIDE COMPARISON MATRIX */}
      {matrixCriteria.length > 0 && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide pb-2 mb-3 border-b border-slate-300 flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-700" />
            <span>Weighted Multi-Criteria Evaluation Matrix</span>
          </h2>

          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold">
                  <th className="p-2 border-r border-slate-300">Evaluation Criteria</th>
                  <th className="p-2 border-r border-slate-300 text-center w-16">Weight</th>
                  {analysis.optionsAnalysis.map((opt) => (
                    <th key={opt.optionId} className="p-2 border-r border-slate-300 text-center">
                      <div className="font-bold">{opt.optionName}</div>
                      {opt.optionId === verdict.winnerOptionId && (
                        <span className="text-[9px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                          Winner
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixCriteria.map((crit, idx) => {
                  const effectiveWeight = weights[crit.id] !== undefined ? weights[crit.id] : crit.weight;
                  return (
                    <tr key={crit.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="p-2 border-t border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{crit.name}</div>
                        <div className="text-[10px] text-slate-500">{crit.description}</div>
                      </td>
                      <td className="p-2 border-t border-r border-slate-200 text-center font-mono font-bold text-slate-700">
                        {effectiveWeight}x
                      </td>
                      {analysis.optionsAnalysis.map((opt) => {
                        const scoreData = getOptionCriterionScore(opt.optionId, crit.id);
                        const rawScore = scoreData?.score || 0;
                        const weightedScore = rawScore * effectiveWeight;
                        return (
                          <td key={opt.optionId} className="p-2 border-t border-r border-slate-200 text-center">
                            <div className="font-bold font-mono text-slate-900">
                              {rawScore}/10{" "}
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({weightedScore} pts)
                              </span>
                            </div>
                            {scoreData?.justification && (
                              <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                                {scoreData.justification}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-900">
                  <td className="p-2 uppercase tracking-wider text-[11px]" colSpan={2}>
                    Total Weighted Score:
                  </td>
                  {analysis.optionsAnalysis.map((opt) => {
                    const total = getOptionMatrixTotal(opt.optionId);
                    const isWinner = opt.optionId === verdict.winnerOptionId;
                    return (
                      <td key={opt.optionId} className={`p-2 text-center font-mono text-sm ${isWinner ? "bg-slate-800 text-amber-300 font-black" : ""}`}>
                        {total} pts
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3: DETAILED BREAKDOWN PER OPTION (Pros, Cons, SWOT, Pre-Mortem) */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide pb-2 mb-4 border-b border-slate-300 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-700" />
          <span>Option Profiles, Strategic Pros/Cons & Risk Assessments</span>
        </h2>

        <div className="space-y-6">
          {analysis.optionsAnalysis.map((opt, i) => {
            const isWinner = opt.optionId === verdict.winnerOptionId;
            const gut = session.userGutFeelings?.[opt.optionId];

            return (
              <div
                key={opt.optionId}
                className={`border rounded-lg p-4 break-inside-avoid ${
                  isWinner ? "border-indigo-400 bg-slate-50/40" : "border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-950">
                        {i + 1}. {opt.optionName}
                      </h3>
                      {isWinner && (
                        <span className="px-2 py-0.5 text-[9px] uppercase font-bold bg-indigo-600 text-white rounded">
                          Recommended Winner
                        </span>
                      )}
                      {gut && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 border border-slate-200 rounded">
                          Gut Feeling: {GUT_FEELING_CONFIG[gut.feeling].emoji} {GUT_FEELING_CONFIG[gut.feeling].label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 italic mt-0.5">{opt.tagline}</p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Best For</span>
                    <span className="font-semibold text-slate-800">{opt.bestFor}</span>
                  </div>
                </div>

                {/* Pros and Cons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                  {/* Pros */}
                  <div className="bg-emerald-50/40 border border-emerald-200 rounded p-3">
                    <span className="font-bold text-emerald-900 block mb-2 uppercase text-[10px] tracking-wider">
                      ✅ Pros & Strategic Strengths ({opt.pros.length})
                    </span>
                    <ul className="space-y-1.5">
                      {opt.pros.map((pro) => (
                        <li key={pro.id} className="text-slate-800 leading-tight">
                          <span className="font-bold text-emerald-800">+{pro.score} </span>
                          <span className="text-slate-900">{pro.text}</span>{" "}
                          <span className="text-[10px] text-slate-500">({pro.category})</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="bg-rose-50/40 border border-rose-200 rounded p-3">
                    <span className="font-bold text-rose-900 block mb-2 uppercase text-[10px] tracking-wider">
                      ❌ Cons, Risks & Trade-Offs ({opt.cons.length})
                    </span>
                    <ul className="space-y-2">
                      {opt.cons.map((con) => (
                        <li key={con.id} className="text-slate-800 leading-tight">
                          <div>
                            <span className="font-bold text-rose-800">{con.score} </span>
                            <span className="text-slate-900">{con.text}</span>{" "}
                            <span className="text-[10px] text-slate-500">({con.category})</span>
                          </div>
                          {con.mitigation && (
                            <div className="text-[10px] text-slate-600 mt-0.5 pl-2 border-l border-rose-300">
                              <span className="font-medium text-slate-800">Mitigation:</span> {con.mitigation}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* SWOT 4-Cell Grid */}
                {opt.swot && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mb-3 pt-2 border-t border-slate-200">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block text-[10px] uppercase text-emerald-800">Strengths</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 mt-1">
                        {opt.swot.strengths.slice(0, 3).map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block text-[10px] uppercase text-rose-800">Weaknesses</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 mt-1">
                        {opt.swot.weaknesses.slice(0, 3).map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block text-[10px] uppercase text-blue-800">Opportunities</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 mt-1">
                        {opt.swot.opportunities.slice(0, 3).map((o, idx) => (
                          <li key={idx}>{o}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block text-[10px] uppercase text-amber-800">Threats</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 mt-1">
                        {opt.swot.threats.slice(0, 3).map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 1-Year Pre-Mortem Risk */}
                {opt.preMortem && (
                  <div className="bg-amber-50/50 p-2.5 rounded border border-amber-200 text-xs text-slate-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950">1-Year Pre-Mortem Risk Simulation: </span>
                      <span>{opt.preMortem}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: SCENARIOS & FUTURE FORECASTING */}
      {analysis.scenarios?.scenarios && analysis.scenarios.scenarios.length > 0 && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide pb-2 mb-3 border-b border-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <span>Scenario Forecasting (Short-Term vs. Long-Term Horizons)</span>
          </h2>

          {analysis.scenarios.comparativeTakeaway && (
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 mb-4 leading-relaxed">
              <span className="font-bold text-slate-900">Comparative Outlook: </span>
              {analysis.scenarios.comparativeTakeaway}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {analysis.scenarios.scenarios.map((sc) => (
              <div key={sc.optionId} className="border border-slate-300 rounded-lg p-3 bg-white">
                <div className="font-bold text-slate-900 text-sm mb-1 pb-1 border-b border-slate-200">
                  {sc.optionName}
                </div>

                <div className="space-y-2 mt-2">
                  <div>
                    <span className="font-bold text-indigo-900 block text-[10px] uppercase">
                      Short-Term Horizon (30–90 Days):
                    </span>
                    <p className="text-slate-700 leading-tight">{sc.shortTerm.narrative}</p>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">Key Milestone:</span> {sc.shortTerm.keyMilestone}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="font-bold text-emerald-900 block text-[10px] uppercase">
                      Long-Term Horizon (1–3 Years):
                    </span>
                    <p className="text-slate-700 leading-tight">{sc.longTerm.narrative}</p>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">Compounded Gain:</span> {sc.longTerm.compoundedAdvantage}
                    </div>
                  </div>

                  {sc.criticalForkInTheRoad && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-900 bg-amber-50/50 p-1.5 rounded">
                      <span className="font-bold">Catalyst Turning Point: </span>
                      <span>{sc.criticalForkInTheRoad}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Report Footer Note */}
      <div className="pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400">
        <div>Generated by The Tiebreaker AI Decision Engine • https://ai.studio/build</div>
        <div>Confidential & Strategic Decision Advisory</div>
      </div>
    </div>
  );
};
