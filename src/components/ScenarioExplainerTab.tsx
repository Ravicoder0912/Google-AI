import React, { useState, useEffect } from "react";
import {
  Film,
  Sparkles,
  Compass,
  Clock,
  Sunrise,
  TrendingUp,
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Square,
  Calendar,
  CheckCircle2,
  Coffee,
  Split,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Loader2,
  Award,
} from "lucide-react";
import {
  DecisionAnalysisResult,
  OptionScenarioNarrative,
  ScenarioExplainerResult,
} from "../types";

interface ScenarioExplainerTabProps {
  decisionTitle: string;
  analysis: DecisionAnalysisResult;
  onUpdateScenarios?: (updatedScenarios: ScenarioExplainerResult) => void;
}

export const ScenarioExplainerTab: React.FC<ScenarioExplainerTabProps> = ({
  decisionTitle,
  analysis,
  onUpdateScenarios,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    analysis.optionsAnalysis[0]?.optionId || ""
  );
  const [timelineView, setTimelineView] = useState<"timeline" | "story_card" | "day_in_life">("timeline");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const scenariosData = analysis.scenarios;
  const winnerOptionId = analysis.tiebreakerVerdict.winnerOptionId;

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Active scenario narrative
  const activeScenario =
    scenariosData?.scenarios.find((s) => s.optionId === selectedOptionId) ||
    scenariosData?.scenarios[0];

  // Speech narration handler
  const handleToggleNarration = (textToRead: string) => {
    if (!window.speechSynthesis) return;

    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);

    window.speechSynthesis.speak(utterance);
    setIsNarrating(true);
  };

  // Re-generate or fetch scenarios if not present
  const handleGenerateScenarios = async (horizon: string = "standard") => {
    setIsGenerating(true);
    setCustomError(null);

    try {
      const res = await fetch("/api/explain-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionTitle,
          options: analysis.optionsAnalysis.map((o) => ({
            id: o.optionId,
            name: o.optionName,
            description: o.tagline,
          })),
          context: analysis.summary,
          focusHorizon: horizon,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate scenario narratives");
      }

      const result: ScenarioExplainerResult = await res.json();
      if (onUpdateScenarios) {
        onUpdateScenarios(result);
      }
    } catch (err: any) {
      console.error("Scenario generation error:", err);
      setCustomError(err.message || "Failed to forecast scenarios.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate if missing
  useEffect(() => {
    if (!scenariosData && !isGenerating) {
      handleGenerateScenarios();
    }
  }, [scenariosData]);

  if (isGenerating && !scenariosData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center space-y-4 animate-in fade-in">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">
          Simulating Future Scenarios & Trajectories...
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Projecting 6-month transition curves, 5-year compounding effects, and "day-in-the-life" narratives for each choice.
        </p>
      </div>
    );
  }

  if (!scenariosData || !activeScenario) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <Compass className="w-10 h-10 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-900 text-base">Scenario Explainer Not Yet Computed</h3>
        <button
          onClick={() => handleGenerateScenarios()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Future Scenarios</span>
        </button>
      </div>
    );
  }

  const narrationScript = `Here is the scenario projection for ${activeScenario.optionName}. In the short term, over the first six months: ${activeScenario.shortTerm.narrative}. In the long term, over the next three to five years: ${activeScenario.longTerm.narrative}. In a typical day: ${activeScenario.dayInTheLife}.`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-lg sm:text-xl">
                  Scenario Explainer & Future Simulation
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Narrative Forecasting
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Step into the future: visualize the short-term transition friction and the long-term compound reality of each choice.
              </p>
            </div>
          </div>

          {/* Narration & Refresh Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => handleToggleNarration(narrationScript)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                isNarrating
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm animate-pulse"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Listen to an audio narrative of this scenario"
            >
              {isNarrating ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{isNarrating ? "Stop Narration" : "Listen to Scenario"}</span>
            </button>

            <button
              onClick={() => handleGenerateScenarios()}
              disabled={isGenerating}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
              title="Regenerate scenarios"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* High Level Comparative Synthesis */}
        {scenariosData.comparativeTakeaway && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-700 bg-slate-50/60 p-3.5 rounded-lg border border-slate-200/80">
            <span className="font-bold text-slate-900">Trajectory Contrast: </span>
            <span>{scenariosData.comparativeTakeaway}</span>
          </div>
        )}
      </div>

      {/* Option Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {scenariosData.scenarios.map((scen) => {
            const isSelected = scen.optionId === activeScenario.optionId;
            const isWinner =
              scen.optionId === winnerOptionId ||
              scen.optionName.toLowerCase() === analysis.tiebreakerVerdict.winnerOptionName.toLowerCase();

            return (
              <button
                key={scen.optionId}
                onClick={() => {
                  setSelectedOptionId(scen.optionId);
                  if (isNarrating && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    setIsNarrating(false);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {isWinner && <Award className="w-3.5 h-3.5 text-indigo-200" />}
                <span>{scen.optionName}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setTimelineView("timeline")}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              timelineView === "timeline" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Timeline Arc
          </button>
          <button
            onClick={() => setTimelineView("day_in_life")}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              timelineView === "day_in_life" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Day in the Life
          </button>
          <button
            onClick={() => setTimelineView("story_card")}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              timelineView === "story_card" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Best vs Worst
          </button>
        </div>
      </div>

      {/* Main Scenario Content */}
      <div className="space-y-6">
        {/* Active Option Banner */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl border border-slate-800 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {activeScenario.optionName}
                </h3>
                {activeScenario.optionId === winnerOptionId && (
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Recommended Path
                  </span>
                )}
              </div>
              <p className="text-indigo-200 text-xs sm:text-sm mt-1">{activeScenario.tagline}</p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Trajectory Simulation
            </div>
          </div>
        </div>

        {/* TIMELINE VIEW */}
        {timelineView === "timeline" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Short-Term Card (Months 1–6) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <Sunrise className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Short-Term Horizon: Transition & Adaptation
                      </h4>
                      <span className="text-[11px] font-mono text-amber-800 font-semibold">
                        {activeScenario.shortTerm.timeframe || "Months 1–6"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Narrative text */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200/80 mb-4">
                  {activeScenario.shortTerm.narrative}
                </p>

                {/* Key Milestone */}
                <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 mb-3">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>First Key Milestone</span>
                  </div>
                  <p className="text-slate-700">{activeScenario.shortTerm.keyMilestone}</p>
                </div>

                {/* Friction points */}
                {activeScenario.shortTerm.frictionPoints?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Initial Friction Points
                    </span>
                    {activeScenario.shortTerm.frictionPoints.map((f, i) => (
                      <div
                        key={i}
                        className="text-xs text-slate-600 flex items-start gap-2 bg-amber-50/40 p-2 rounded border border-amber-100"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emotional state */}
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Projected Emotional State: </span>
                <span>{activeScenario.shortTerm.emotionalState}</span>
              </div>
            </div>

            {/* Long-Term Card (Years 2–5) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Long-Term Horizon: Compounding Trajectory
                      </h4>
                      <span className="text-[11px] font-mono text-indigo-800 font-semibold">
                        {activeScenario.longTerm.timeframe || "Years 2–5"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Narrative text */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200/80 mb-4">
                  {activeScenario.longTerm.narrative}
                </p>

                {/* Compounded Advantage */}
                <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 mb-3">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-900 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Compounded Strategic Advantage</span>
                  </div>
                  <p className="text-slate-700">{activeScenario.longTerm.compoundedAdvantage}</p>
                </div>

                {/* Second Order Effects */}
                {activeScenario.longTerm.secondOrderEffects?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Second-Order Ripple Effects
                    </span>
                    {activeScenario.longTerm.secondOrderEffects.map((eff, i) => (
                      <div
                        key={i}
                        className="text-xs text-slate-600 flex items-start gap-2 bg-indigo-50/30 p-2 rounded border border-indigo-100"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span>{eff}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ultimate Outcome */}
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Ultimate End-State: </span>
                <span>{activeScenario.longTerm.ultimateOutcome}</span>
              </div>
            </div>
          </div>
        )}

        {/* DAY IN THE LIFE VIEW */}
        {timelineView === "day_in_life" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base sm:text-lg">
                  A Day in the Life: Living This Choice
                </h4>
                <p className="text-xs text-slate-500">
                  What a typical Tuesday feels like once this decision is locked in and normalized
                </p>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed italic relative">
              <span className="text-4xl text-slate-300 font-serif absolute top-2 left-3">“</span>
              <p className="pl-4 pt-1">{activeScenario.dayInTheLife}</p>
            </div>

            {/* Critical Fork in the Road Callout */}
            <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-purple-900 font-bold mb-1.5">
                <Split className="w-4 h-4 text-purple-700" />
                <span>The Make-or-Break Fork in the Road</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {activeScenario.criticalForkInTheRoad}
              </p>
            </div>
          </div>
        )}

        {/* BEST VS WORST TRAJECTORY VIEW */}
        {timelineView === "story_card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Case */}
            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6 space-y-3 bg-gradient-to-b from-emerald-50/30 to-white">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm sm:text-base pb-2 border-b border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Best-Case Trajectory (Full Potential)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeScenario.bestCaseTrajectory}
              </p>
            </div>

            {/* Worst Case */}
            <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-6 space-y-3 bg-gradient-to-b from-rose-50/30 to-white">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm sm:text-base pb-2 border-b border-rose-100">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Worst-Case Trajectory (Downside Bound)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeScenario.worstCaseTrajectory}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
