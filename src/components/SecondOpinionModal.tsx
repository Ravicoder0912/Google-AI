import React, { useState, useEffect } from "react";
import {
  Eye,
  X,
  AlertTriangle,
  ShieldAlert,
  Brain,
  Lightbulb,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Scale,
  Compass,
  ArrowRight,
} from "lucide-react";
import { DecisionSession, SecondOpinionResult } from "../types";

interface SecondOpinionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: DecisionSession;
}

export const SecondOpinionModal: React.FC<SecondOpinionModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SecondOpinionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "biases" | "blindspots" | "alternatives" | "questions">("all");

  const fetchSecondOpinion = async (force = false) => {
    if (!force && data) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/second-opinion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionTitle: session.title,
          options: session.options,
          context: session.context,
          priorities: session.priorities,
          riskTolerance: session.riskTolerance,
          timeHorizon: session.timeHorizon,
          currentAnalysis: session.analysis,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to audit decision for biases and blind spots.");
      }

      const result: SecondOpinionResult = await res.json();
      setData(result);
    } catch (err: any) {
      console.error("Error fetching second opinion:", err);
      setError(err.message || "Failed to generate second opinion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data && !loading) {
      fetchSecondOpinion();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    if (!data) return;
    const text = `# AI Second Opinion & Bias Audit
**Decision:** ${session.title}
**Overall Bias Risk Level:** ${data.overallRiskLevel.toUpperCase()}

## Executive Verdict
${data.executiveVerdict}

## Identified Cognitive Biases
${data.identifiedBiases
  .map(
    (b) => `### ${b.name} (${b.severity.toUpperCase()} Severity)
- **Impact:** ${b.explanation}
- **Reframing Prompt:** ${b.mitigationPrompt}`
  )
  .join("\n\n")}

## Critical Blind Spots & Unasked Questions
${data.blindSpots
  .map(
    (bs) => `### ${bs.area}
- **Description:** ${bs.description}
- **The Unasked Question:** ${bs.unaskedQuestion}`
  )
  .join("\n\n")}

## The Third Path / Alternative Options
${data.alternativePaths
  .map(
    (alt) => `### ${alt.title}
- ${alt.description}
- *Advantage:* ${alt.advantage}`
  )
  .join("\n\n")}

## Pressure Test Questions
${data.pressureTestQuestions.map((q, idx) => `${idx + 1}. ${q}`).join("\n")}

## Recalibrated Takeaway
${data.recalibratedAdvice}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: ShieldAlert,
          label: "Critical Bias Risk",
        };
      case "high":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: AlertTriangle,
          label: "High Bias Vulnerability",
        };
      case "moderate":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: Compass,
          label: "Moderate Blind Spots",
        };
      default:
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
          label: "Low Bias Vulnerability",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-sm">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  AI Second Opinion
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Cognitive Bias & Blind Spot Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                Auditing: <span className="font-semibold text-slate-700">{session.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data && (
              <>
                <button
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
                  title="Copy full audit report as Markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span className="hidden sm:inline">{copied ? "Copied" : "Copy Audit"}</span>
                </button>

                <button
                  onClick={() => fetchSecondOpinion(true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  title="Re-run Second Opinion Audit"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Re-Audit</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin" />
                <Eye className="w-5 h-5 text-indigo-600 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Auditing Decision Architecture...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Scanning for binary traps, status-quo anchoring, framing distortion, and unexamined risk assumptions.
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-1">Audit Generation Error</span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchSecondOpinion(true)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-xs cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Executive Verdict & Risk Banner */}
              {(() => {
                const risk = getRiskBadge(data.overallRiskLevel);
                const RiskIcon = risk.icon;

                return (
                  <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm border border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          Auditor Verdict
                        </span>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${risk.bg}`}>
                        <RiskIcon className="w-3.5 h-3.5" />
                        <span>{risk.label}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-normal">
                      {data.executiveVerdict}
                    </p>
                  </div>
                );
              })()}

              {/* Sub Navigation Filter */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "all"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Full Audit Overview
                </button>
                <button
                  onClick={() => setActiveTab("biases")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "biases"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Cognitive Biases ({data.identifiedBiases.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("blindspots")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "blindspots"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Blind Spots ({data.blindSpots.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("alternatives")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "alternatives"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>The Third Path ({data.alternativePaths.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("questions")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "questions"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Pressure Tests ({data.pressureTestQuestions.length})</span>
                </button>
              </div>

              {/* 1. Cognitive Biases Section */}
              {(activeTab === "all" || activeTab === "biases") && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Identified Cognitive Biases & Distortions
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.identifiedBiases.map((bias, idx) => {
                      const severityColors =
                        bias.severity === "high"
                          ? "border-rose-200 bg-rose-50/40 text-rose-900"
                          : bias.severity === "medium"
                          ? "border-amber-200 bg-amber-50/40 text-amber-900"
                          : "border-slate-200 bg-slate-50/60 text-slate-900";

                      return (
                        <div
                          key={idx}
                          className={`border rounded-xl p-4 flex flex-col justify-between ${severityColors}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-bold text-sm text-slate-950">
                                {bias.name}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                                {bias.severity} impact
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed mb-3">
                              {bias.explanation}
                            </p>
                          </div>
                          <div className="pt-2.5 border-t border-slate-200/60 bg-white/70 -mx-4 -mb-4 p-3 rounded-b-xl">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">
                              🔍 Reframing Question:
                            </span>
                            <p className="text-xs font-medium text-slate-800 italic">
                              "{bias.mitigationPrompt}"
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Critical Blind Spots Section */}
              {(activeTab === "all" || activeTab === "blindspots") && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Critical Blind Spots & Unexamined Assumptions
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {data.blindSpots.map((spot, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 rounded">
                            {spot.area}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                          {spot.description}
                        </p>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 flex items-start gap-2">
                          <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-indigo-900 block text-[11px] uppercase">
                              The Crucial Unasked Question:
                            </span>
                            <span className="text-slate-800 font-medium">{spot.unaskedQuestion}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. The Third Path / Alternative Options */}
              {(activeTab === "all" || activeTab === "alternatives") && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      "The Third Path" — Unconsidered Alternatives
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    High-stakes decisions often suffer from false dichotomies. Consider these hybrid or phased compromises:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {data.alternativePaths.map((alt, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1.5">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{alt.title}</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed mb-3">
                            {alt.description}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-900">
                          <span className="font-bold block">Strategic Advantage:</span>
                          <span className="text-slate-800">{alt.advantage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. High Stakes Pressure Test Questions */}
              {(activeTab === "all" || activeTab === "questions") && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      High-Stakes Pressure Test Questions
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.pressureTestQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed">
                          {q}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Recalibrated Advice Banner */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 text-xs text-slate-800">
                <span className="font-bold text-indigo-950 block mb-1 text-sm flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-700" />
                  <span>Auditor's Final Recommendation & Calibration</span>
                </span>
                <p className="leading-relaxed text-slate-700">{data.recalibratedAdvice}</p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>Powered by Behavioral Economics & Cognitive Risk Frameworks</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
