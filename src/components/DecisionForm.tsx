import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  Compass,
  Clock,
  ShieldAlert,
  ArrowRight,
  Loader2,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Globe,
  Brain,
  Zap,
} from "lucide-react";
import { DecisionOption, PresetTemplate } from "../types";

interface DecisionFormData {
  decisionTitle: string;
  options: DecisionOption[];
  context: string;
  priorities: string[];
  riskTolerance: "conservative" | "balanced" | "aggressive";
  timeHorizon: "short_term" | "medium_term" | "long_term";
  enableSearchGrounding?: boolean;
  highThinking?: boolean;
}

interface DecisionFormProps {
  onSubmit: (data: DecisionFormData) => Promise<void>;
  isLoading: boolean;
  onSelectTemplate?: (template: PresetTemplate) => void;
  templates: PresetTemplate[];
  initialData?: DecisionFormData | null;
}

const COMMON_PRIORITIES = [
  "High Financial ROI",
  "Work-Life Balance & Peace of Mind",
  "Long-term Career Upside",
  "Speed of Execution",
  "Autonomy & Creative Freedom",
  "Geographic Flexibility",
  "High Reversibility / Low Lock-in",
  "Learning & Skill Growth",
  "Family & Relationship Stability",
  "Low Initial Capital Outlay",
];

export const DecisionForm: React.FC<DecisionFormProps> = ({
  onSubmit,
  isLoading,
  onSelectTemplate,
  templates,
  initialData,
}) => {
  const [title, setTitle] = useState(initialData?.decisionTitle || "");
  const [options, setOptions] = useState<DecisionOption[]>(
    initialData?.options && initialData.options.length >= 2
      ? initialData.options
      : [
          { id: "opt-1", name: "Option A", description: "" },
          { id: "opt-2", name: "Option B", description: "" },
        ]
  );
  const [context, setContext] = useState(initialData?.context || "");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    initialData?.priorities && initialData.priorities.length > 0
      ? initialData.priorities
      : ["High Financial ROI", "Work-Life Balance & Peace of Mind"]
  );
  const [customPriorityInput, setCustomPriorityInput] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<"conservative" | "balanced" | "aggressive">(
    initialData?.riskTolerance || "balanced"
  );
  const [timeHorizon, setTimeHorizon] = useState<"short_term" | "medium_term" | "long_term">(
    initialData?.timeHorizon || "medium_term"
  );
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(
    initialData?.enableSearchGrounding !== undefined ? initialData.enableSearchGrounding : true
  );
  const [highThinking, setHighThinking] = useState(
    initialData?.highThinking !== undefined ? initialData.highThinking : false
  );
  const [isSuggestingOptions, setIsSuggestingOptions] = useState(false);
  const [quickInsightLoading, setQuickInsightLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string | null>(null);

  // Synchronize state if initialData changes
  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.decisionTitle || "");
      if (initialData.options && initialData.options.length >= 2) {
        setOptions(initialData.options);
      }
      setContext(initialData.context || "");
      if (initialData.priorities && initialData.priorities.length > 0) {
        setSelectedPriorities(initialData.priorities);
      }
      if (initialData.riskTolerance) {
        setRiskTolerance(initialData.riskTolerance);
      }
      if (initialData.timeHorizon) {
        setTimeHorizon(initialData.timeHorizon);
      }
      if (initialData.enableSearchGrounding !== undefined) {
        setEnableSearchGrounding(initialData.enableSearchGrounding);
      }
      if (initialData.highThinking !== undefined) {
        setHighThinking(initialData.highThinking);
      }
    }
  }, [initialData]);

  // Load template directly into form fields for full editing
  const handleLoadTemplate = (tpl: PresetTemplate) => {
    setTitle(tpl.title);
    const formattedOptions: DecisionOption[] = tpl.options.map((opt, i) => ({
      id: `opt-${Date.now()}-${i + 1}`,
      name: opt.name,
      description: opt.description,
    }));
    setOptions(formattedOptions);
    setContext(tpl.context || "");
    setSelectedPriorities(tpl.priorities || ["High Financial ROI", "Work-Life Balance & Peace of Mind"]);
    setRiskTolerance(tpl.riskTolerance || "balanced");
    setTimeHorizon(tpl.timeHorizon || "medium_term");
    setLoadedTemplateName(tpl.title);
    setErrorMsg(null);

    // Call optional callback if provided
    if (onSelectTemplate) {
      onSelectTemplate(tpl);
    }

    // Scroll smoothly to the form
    setTimeout(() => {
      document.getElementById("decision-form-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Reset to blank form
  const handleResetForm = () => {
    setTitle("");
    setOptions([
      { id: `opt-${Date.now()}-1`, name: "Option A", description: "" },
      { id: `opt-${Date.now()}-2`, name: "Option B", description: "" },
    ]);
    setContext("");
    setSelectedPriorities(["High Financial ROI", "Work-Life Balance & Peace of Mind"]);
    setRiskTolerance("balanced");
    setTimeHorizon("medium_term");
    setLoadedTemplateName(null);
    setErrorMsg(null);
  };

  // Add Option
  const handleAddOption = () => {
    if (options.length >= 5) return;
    const nextChar = String.fromCharCode(65 + options.length); // C, D, E
    setOptions([
      ...options,
      { id: `opt-${Date.now()}-${options.length + 1}`, name: `Option ${nextChar}`, description: "" },
    ]);
  };

  // Remove Option
  const handleRemoveOption = (indexToRemove: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== indexToRemove));
  };

  // Update Option Field
  const handleUpdateOption = (index: number, field: "name" | "description", value: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  // AI Suggest Options (Fast Brainstorming via gemini-3.1-flash-lite)
  const handleSuggestOptions = async () => {
    if (!title.trim()) {
      setErrorMsg("Please enter your decision dilemma first (e.g. 'Should I accept job offer A or B?').");
      return;
    }
    setErrorMsg(null);
    setIsSuggestingOptions(true);
    try {
      const res = await fetch("/api/suggest-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionTitle: title, context }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to auto-suggest options");
      }
      if (data.suggestedOptions && Array.isArray(data.suggestedOptions) && data.suggestedOptions.length >= 2) {
        const mapped: DecisionOption[] = data.suggestedOptions.map((item: any, idx: number) => ({
          id: `opt-ai-${idx + 1}`,
          name: item.name,
          description: item.description,
          keyTheme: item.keyTheme,
        }));
        setOptions(mapped);
      } else {
        setErrorMsg("Could not generate distinct options for this dilemma. You can type them manually below.");
      }
    } catch (err: any) {
      console.error("Option suggestion error:", err);
      setErrorMsg(
        err.message?.includes("503") || err.message?.includes("demand")
          ? "AI model is currently experiencing high traffic. Please retry in a few seconds or enter your options manually below."
          : (err.message || "Failed to auto-suggest options. You can type them manually below.")
      );
    } finally {
      setIsSuggestingOptions(false);
    }
  };

  // Quick Low-Latency Pro/Con helper using gemini-3.1-flash-lite
  const handleQuickProCon = async (optionIdx: number, type: "pro" | "con") => {
    const opt = options[optionIdx];
    if (!title.trim() || !opt.name.trim()) {
      setErrorMsg("Please provide dilemma title and option name first.");
      return;
    }
    setQuickInsightLoading(`${optionIdx}-${type}`);
    try {
      const res = await fetch("/api/quick-pro-con", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionTitle: title,
          optionName: opt.name,
          type,
          context,
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        const currentDesc = opt.description ? `${opt.description} | ` : "";
        const appendText = type === "pro" ? `[Key Pro: ${data.text}]` : `[Key Watchout: ${data.text}]`;
        handleUpdateOption(optionIdx, "description", `${currentDesc}${appendText}`);
      }
    } catch (err) {
      console.error("Quick pro/con error:", err);
    } finally {
      setQuickInsightLoading(null);
    }
  };

  // Toggle Priority
  const handleTogglePriority = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      setSelectedPriorities(selectedPriorities.filter((p) => p !== priority));
    } else {
      if (selectedPriorities.length < 5) {
        setSelectedPriorities([...selectedPriorities, priority]);
      }
    }
  };

  // Add Custom Priority
  const handleAddCustomPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPriorityInput.trim()) return;
    if (!selectedPriorities.includes(customPriorityInput.trim())) {
      setSelectedPriorities([...selectedPriorities, customPriorityInput.trim()]);
    }
    setCustomPriorityInput("");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Please provide the decision you want to evaluate.");
      return;
    }

    const validOptions = options.filter((o) => o.name.trim().length > 0);
    if (validOptions.length < 2) {
      setErrorMsg("Please provide at least 2 distinct option names to compare.");
      return;
    }

    await onSubmit({
      decisionTitle: title.trim(),
      options: validOptions,
      context: context.trim(),
      priorities: selectedPriorities,
      riskTolerance,
      timeHorizon,
      enableSearchGrounding,
      highThinking,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-5 sm:py-8 px-3 sm:px-6">
      {/* Intro hero box */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="uppercase tracking-wider text-[10px] sm:text-[11px]">Objective Decision Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-2 sm:mb-3">
          What decision is keeping you up at night?
        </h1>
        <p className="text-slate-600 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
          Frame your dilemma, compare your options side-by-side with weighted pros & cons, full SWOT breakdown, and let The Tiebreaker deliver an actionable verdict.
        </p>

        {/* Quick template suggestions */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Quick Start:</span>
          {templates.slice(0, 4).map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleLoadTemplate(tpl)}
              className="text-xs px-2.5 py-1 rounded-md bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-all border border-slate-200 hover:border-indigo-200 shadow-xs truncate max-w-[260px] sm:max-w-none cursor-pointer flex items-center gap-1"
              title={`Load "${tpl.title}" into the form`}
            >
              <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>{tpl.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loaded template notice & quick actions */}
      {loadedTemplateName && (
        <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-indigo-900 truncate">Template Loaded: {loadedTemplateName}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-200/70 text-indigo-800 uppercase">
                  Ready to Edit
                </span>
              </div>
              <p className="text-indigo-700 text-xs mt-0.5">
                All written words, options, and context are populated below. You can customize anything before running!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Reset Form
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 sm:gap-3">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">Attention Needed</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <form
        id="decision-form-container"
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-8 space-y-6 sm:space-y-8"
      >
        {/* Section 1: The Decision Question */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label htmlFor="decision-title-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. The Core Dilemma or Question <span className="text-indigo-600">*</span>
            </label>
            <button
              type="button"
              onClick={handleSuggestOptions}
              disabled={isSuggestingOptions || !title.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isSuggestingOptions ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Auto-Suggest Options</span>
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <input
              id="decision-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Should I accept the Series-B Startup offer or stay at my Big Tech job?"
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400 bg-slate-50/50"
            />
          </div>
          <p className="mt-1.5 text-[11px] sm:text-xs text-slate-500">
            Be as specific as you like (e.g. mention compensation, career goals, or relocation).
          </p>
        </div>

        {/* Section 2: Options */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Options to Compare ({options.length}/5) <span className="text-indigo-600">*</span>
            </label>
            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {options.map((option, idx) => (
              <div
                key={option.id}
                className="p-3 sm:p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all relative group"
              >
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-0">
                    <input
                      type="text"
                      value={option.name}
                      onChange={(e) => handleUpdateOption(idx, "name", e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + idx)} Name`}
                      className="sm:col-span-1 px-3 py-2 text-xs sm:text-sm font-medium rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                    />
                    <input
                      type="text"
                      value={option.description || ""}
                      onChange={(e) => handleUpdateOption(idx, "description", e.target.value)}
                      placeholder="Key details (e.g. $140k + equity, 55hr/wk)"
                      className="sm:col-span-2 px-3 py-2 text-xs sm:text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-700 placeholder:text-slate-400"
                    />
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors shrink-0 mt-1 sm:mt-0 cursor-pointer"
                      title="Remove this option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Quick Fast Pro/Con buttons using low-latency gemini-3.1-flash-lite */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fast Assist:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickProCon(idx, "pro")}
                      disabled={quickInsightLoading !== null}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                      title="Generate instant high-impact pro via Gemini 3.1 Flash Lite"
                    >
                      {quickInsightLoading === `${idx}-pro` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>+ Quick Pro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickProCon(idx, "con")}
                      disabled={quickInsightLoading !== null}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 px-2 py-0.5 rounded transition-colors cursor-pointer disabled:opacity-50"
                      title="Generate instant critical downside via Gemini 3.1 Flash Lite"
                    >
                      {quickInsightLoading === `${idx}-con` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3 text-rose-600" />
                      )}
                      <span>+ Quick Con</span>
                    </button>
                  </div>
                  {option.keyTheme && (
                    <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                      Theme: {option.keyTheme}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Priorities & Weighted Values */}
        <div>
          <div className="flex items-center justify-between mb-1 border-b border-slate-100 pb-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Priorities & Evaluation Weights
            </label>
            <span className="text-[11px] font-semibold text-slate-400">
              {selectedPriorities.length}/5 selected
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3 mt-2">
            The Tiebreaker will heavily factor these core values when evaluating trade-offs.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_PRIORITIES.map((priority) => {
              const isSelected = selectedPriorities.includes(priority);
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleTogglePriority(priority)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{priority}</span>
                </button>
              );
            })}
          </div>

          {/* Add custom priority */}
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={customPriorityInput}
              onChange={(e) => setCustomPriorityInput(e.target.value)}
              placeholder="Add custom value (e.g. 10-min commute, Pet friendly)..."
              className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
            <button
              type="button"
              onClick={handleAddCustomPriority}
              disabled={!customPriorityInput.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-md disabled:opacity-40 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Section 4: Context & Calibration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          {/* Risk Tolerance */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Risk Tolerance Profile</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "conservative", label: "Cautious", desc: "Prioritize safety" },
                { id: "balanced", label: "Balanced", desc: "Pragmatic upside" },
                { id: "aggressive", label: "High Upside", desc: "Max return" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRiskTolerance(item.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    riskTolerance === item.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Evaluation Time Horizon</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "short_term", label: "Immediate (<1y)", desc: "Fast payoff" },
                { id: "medium_term", label: "Medium (1-3y)", desc: "Compound" },
                { id: "long_term", label: "Long (5y+)", desc: "Decade-scale" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTimeHorizon(item.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    timeHorizon === item.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Additional Context & Constraints */}
        <div>
          <label htmlFor="context-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            4. Constraints & Personal Context (Optional)
          </label>
          <textarea
            id="context-input"
            rows={3}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Share any special circumstances (e.g. 'I have a toddler starting preschool next year', 'Emergency fund is 4 months', 'I dislike frequent business travel')..."
            className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Section 6: Advanced Gemini Intelligence & Search Grounding Controls */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gemini Engine Intelligence Modes</span>
            </span>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
              Real-time Google Grounded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Search Grounding Toggle */}
            <div
              onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                enableSearchGrounding
                  ? "bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-xs"
                  : "bg-slate-100/60 border-slate-200 opacity-75"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Google Search Grounding</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      enableSearchGrounding ? "bg-indigo-600 text-white" : "bg-slate-300 text-slate-600"
                    }`}
                  >
                    {enableSearchGrounding ? "✓" : ""}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Verifies live salaries, cost of living, reviews & verified links using <strong className="text-indigo-700">gemini-3.5-flash</strong>.
                </p>
              </div>
            </div>

            {/* High Thinking Mode Toggle */}
            <div
              onClick={() => setHighThinking(!highThinking)}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                highThinking
                  ? "bg-white border-purple-500 ring-1 ring-purple-500 shadow-xs"
                  : "bg-slate-100/60 border-slate-200 opacity-75"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">High Reasoning Thinking</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      highThinking ? "bg-purple-600 text-white" : "bg-slate-300 text-slate-600"
                    }`}
                  >
                    {highThinking ? "✓" : ""}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Deep multi-step game-theory reasoning and risk modeling via <strong className="text-purple-700">gemini-3.1-pro-preview</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Generates Pros/Cons, Comparison Matrix, SWOT & Definitive Verdict</span>
          </div>

          <button
            id="btn-analyze-decision"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {highThinking ? "Engaging High-Reasoning Gemini 3.1 Pro..." : "Analyzing Decision Matrix..."}
                </span>
              </>
            ) : (
              <>
                <span>Run The Tiebreaker</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
