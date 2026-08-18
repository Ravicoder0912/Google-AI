import React, { useState } from "react";
import {
  Heart,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Flame,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Brain,
  MessageSquareHeart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DecisionAnalysisResult,
  GutFeelingRecord,
  GutFeelingValue,
  GutFeelingEntry,
} from "../types";

interface GutFeelingSectionProps {
  analysis: DecisionAnalysisResult;
  userGutFeelings?: GutFeelingRecord;
  onUpdateGutFeelings: (gutFeelings: GutFeelingRecord) => void;
  compact?: boolean;
}

export const GUT_FEELING_CONFIG: Record<
  GutFeelingValue,
  {
    label: string;
    shortLabel: string;
    emoji: string;
    score: number; // 1 to 5
    bgClass: string;
    borderClass: string;
    textClass: string;
    activeClass: string;
    description: string;
  }
> = {
  excited: {
    label: "Strong Positive (Excited / Energized)",
    shortLabel: "Excited",
    emoji: "🤩",
    score: 5,
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-800",
    activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-600/20",
    description: "Your intuition feels energized, expansive, and genuinely thrilled.",
  },
  positive: {
    label: "Leaning Positive (Optimistic / Calm)",
    shortLabel: "Optimistic",
    emoji: "🙂",
    score: 4,
    bgClass: "bg-teal-50",
    borderClass: "border-teal-200",
    textClass: "text-teal-800",
    activeClass: "bg-teal-600 text-white border-teal-600 shadow-xs ring-2 ring-teal-600/20",
    description: "Feels safe, balanced, and intuitively right without overwhelming hype.",
  },
  neutral: {
    label: "Neutral / Mixed (Unsure / 50-50)",
    shortLabel: "Neutral",
    emoji: "😐",
    score: 3,
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    textClass: "text-slate-700",
    activeClass: "bg-slate-700 text-white border-slate-700 shadow-xs ring-2 ring-slate-700/20",
    description: "Ambivalent or waiting for more clarity; no strong visceral pull either way.",
  },
  uneasy: {
    label: "Hesitant / Uneasy (Apprehensive)",
    shortLabel: "Hesitant",
    emoji: "😟",
    score: 2,
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-800",
    activeClass: "bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-600/20",
    description: "A persistent nagging doubt, tension in the chest, or quiet resistance.",
  },
  dread: {
    label: "Strong Negative (Dread / High Friction)",
    shortLabel: "Dread",
    emoji: "😫",
    score: 1,
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    textClass: "text-rose-800",
    activeClass: "bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-600/20",
    description: "Visceral dread, anxiety, or feeling like you are forcing yourself into a corner.",
  },
};

export const GutFeelingSection: React.FC<GutFeelingSectionProps> = ({
  analysis,
  userGutFeelings = {},
  onUpdateGutFeelings,
  compact = false,
}) => {
  const [editingNotesOptionId, setEditingNotesOptionId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const options = analysis.optionsAnalysis;
  const winnerOptionId = analysis.tiebreakerVerdict.winnerOptionId;

  const handleSelectFeeling = (optionId: string, feeling: GutFeelingValue) => {
    const existing = userGutFeelings[optionId];
    const updated: GutFeelingRecord = {
      ...userGutFeelings,
      [optionId]: {
        feeling,
        notes: existing?.notes || "",
        timestamp: new Date().toISOString(),
      },
    };
    onUpdateGutFeelings(updated);
  };

  const handleSaveNotes = (optionId: string) => {
    const existing = userGutFeelings[optionId];
    if (!existing) return;
    const updated: GutFeelingRecord = {
      ...userGutFeelings,
      [optionId]: {
        ...existing,
        notes: tempNotes.trim(),
        timestamp: new Date().toISOString(),
      },
    };
    onUpdateGutFeelings(updated);
    setEditingNotesOptionId(null);
    setTempNotes("");
  };

  // Compute Intuition vs Logic synthesis
  const recordedCount = Object.keys(userGutFeelings).length;
  const allRecorded = options.every((opt) => userGutFeelings[opt.optionId]);

  let synthesis = null;
  if (recordedCount > 0) {
    const aiWinnerOpt = options.find(
      (o) => o.optionId === winnerOptionId || o.optionName.toLowerCase() === analysis.tiebreakerVerdict.winnerOptionName.toLowerCase()
    );
    const aiWinnerGut = aiWinnerOpt ? userGutFeelings[aiWinnerOpt.optionId]?.feeling : null;

    // Find highest gut feeling option
    let highestGutOpt: { optionId: string; optionName: string; feeling: GutFeelingValue; score: number } | null = null;
    options.forEach((opt) => {
      const g = userGutFeelings[opt.optionId];
      if (g) {
        const score = GUT_FEELING_CONFIG[g.feeling].score;
        if (!highestGutOpt || score > highestGutOpt.score) {
          highestGutOpt = {
            optionId: opt.optionId,
            optionName: opt.optionName,
            feeling: g.feeling,
            score,
          };
        }
      }
    });

    if (aiWinnerOpt && aiWinnerGut) {
      if (aiWinnerGut === "excited" || aiWinnerGut === "positive") {
        synthesis = {
          type: "harmony",
          title: "✨ Heart & Logic in Full Harmony",
          badge: "Aligned Alignment",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
          message: `Both AI rational scoring and your intuition strongly favor "${aiWinnerOpt.optionName}". You can proceed with total conviction knowing your head and heart are unified.`,
        };
      } else if (aiWinnerGut === "dread" || aiWinnerGut === "uneasy") {
        synthesis = {
          type: "conflict",
          title: "⚠️ Rational vs. Visceral Intuition Clash",
          badge: "Intuition Paradox",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
          message: `On paper, AI weighted analysis recommends "${aiWinnerOpt.optionName}", but your gut registered ${GUT_FEELING_CONFIG[aiWinnerGut].label}. Cognitive scientists find that dread often signals unquantifiable emotional costs or boundary conflicts. Re-examine why your subconscious resists this choice!`,
        };
      } else {
        synthesis = {
          type: "neutral",
          title: "⚖️ Analytical Clarity Overcoming Ambivalence",
          badge: "Logic Guided",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
          message: `Your intuition is neutral regarding "${aiWinnerOpt.optionName}". Trust the structured matrix and 7-day action plan to build positive momentum.`,
        };
      }
    }
  }

  return (
    <div
      id="gut-feeling-section"
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-purple-50/50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Heart className="w-4 h-4 text-white fill-white/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Gut Feeling & Intuition Check
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Human Factor
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Before final commitment, record your raw intuitive reaction for each option.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/50 transition-colors"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-4">
            {options.map((opt) => {
              const currentFeeling = userGutFeelings[opt.optionId]?.feeling;
              const currentNotes = userGutFeelings[opt.optionId]?.notes;
              const isWinner =
                opt.optionId === winnerOptionId ||
                opt.optionName.toLowerCase() === analysis.tiebreakerVerdict.winnerOptionName.toLowerCase();

              return (
                <div
                  key={opt.optionId}
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    currentFeeling
                      ? "bg-slate-50/50 border-slate-300 shadow-xs"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {opt.optionName}
                        </span>
                        {isWinner && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            AI Verdict Winner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.tagline}</p>
                    </div>

                    {currentFeeling && (
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="text-xs font-semibold text-slate-500">Your Gut:</span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 border ${GUT_FEELING_CONFIG[currentFeeling].bgClass} ${GUT_FEELING_CONFIG[currentFeeling].borderClass} ${GUT_FEELING_CONFIG[currentFeeling].textClass}`}
                        >
                          <span>{GUT_FEELING_CONFIG[currentFeeling].emoji}</span>
                          <span>{GUT_FEELING_CONFIG[currentFeeling].shortLabel}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feeling Emoji Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(Object.keys(GUT_FEELING_CONFIG) as GutFeelingValue[]).map((val) => {
                      const cfg = GUT_FEELING_CONFIG[val];
                      const isSelected = currentFeeling === val;

                      return (
                        <button
                          key={val}
                          onClick={() => handleSelectFeeling(opt.optionId, val)}
                          className={`p-2.5 rounded-lg border text-left sm:text-center transition-all flex sm:flex-col items-center sm:justify-center gap-2 select-none cursor-pointer ${
                            isSelected
                              ? cfg.activeClass
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span className="text-lg">{cfg.emoji}</span>
                          <div className="leading-tight">
                            <span className="block text-xs font-semibold">
                              {cfg.shortLabel}
                            </span>
                            <span
                              className={`block text-[10px] hidden sm:block ${
                                isSelected ? "text-white/80" : "text-slate-400"
                              }`}
                            >
                              {val === "excited"
                                ? "Expansive"
                                : val === "positive"
                                ? "Safe"
                                : val === "neutral"
                                ? "Mixed"
                                : val === "uneasy"
                                ? "Doubt"
                                : "Dread"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Note / Reflection */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    {editingNotesOptionId === opt.optionId ? (
                      <div className="w-full space-y-2 animate-in fade-in">
                        <input
                          type="text"
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="What specifically makes your gut feel this way? (e.g. 'I dread the commute', 'I love the founder')"
                          className="w-full px-3 py-1.5 text-xs rounded-md border border-indigo-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveNotes(opt.optionId);
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingNotesOptionId(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-0.5"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(opt.optionId)}
                            className="text-xs font-medium bg-indigo-600 text-white rounded px-2.5 py-1 hover:bg-indigo-700"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        {currentNotes ? (
                          <div className="flex items-center gap-1.5 text-slate-600 italic">
                            <MessageSquareHeart className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span>"{currentNotes}"</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {currentFeeling
                              ? "Optional: Add why your gut feels this way"
                              : "Tap a button above to record your instinct"}
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setEditingNotesOptionId(opt.optionId);
                            setTempNotes(currentNotes || "");
                          }}
                          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline ml-2 flex-shrink-0"
                        >
                          {currentNotes ? "Edit note" : "+ Add reason"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Logic vs Human Intuition Synthesis Banner */}
          {synthesis && (
            <div
              className={`p-5 rounded-xl border animate-in zoom-in-95 duration-200 ${
                synthesis.type === "harmony"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  : synthesis.type === "conflict"
                  ? "bg-rose-50/80 border-rose-200 text-rose-950"
                  : "bg-indigo-50/80 border-indigo-200 text-indigo-950"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white shadow-xs flex-shrink-0 mt-0.5">
                  <Brain className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm sm:text-base">
                      {synthesis.title}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${synthesis.badgeColor}`}
                    >
                      {synthesis.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                    {synthesis.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
