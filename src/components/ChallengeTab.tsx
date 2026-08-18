import React, { useState } from "react";
import {
  MessageSquareQuote,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { DecisionAnalysisResult, ChallengeMessage } from "../types";

interface ChallengeTabProps {
  decisionTitle: string;
  analysis: DecisionAnalysisResult;
  messages: ChallengeMessage[];
  onAddMessage: (msg: ChallengeMessage) => void;
}

const SAMPLE_CHALLENGES = [
  "What if I experience sudden burnout 6 months in?",
  "What if macroeconomic conditions worsen significantly next year?",
  "How does this choice change if I value geographic freedom above all else?",
  "What if the team culture turns out to be toxic or micromanaging?",
];

export const ChallengeTab: React.FC<ChallengeTabProps> = ({
  decisionTitle,
  analysis,
  messages,
  onAddMessage,
}) => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (qText: string) => {
    if (!qText.trim() || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/challenge-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionTitle,
          currentAnalysis: analysis,
          userQuestion: qText.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to challenge decision.");
      }

      const data = await res.json();
      const newMessage: ChallengeMessage = {
        id: `msg-${Date.now()}`,
        question: qText.trim(),
        answer: data,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      onAddMessage(newMessage);
      setQuestion("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process question.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
          <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
          <span>Challenge The Decision Advisor</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Test the resilience of your verdict with hypothetical "What If?" scenarios, new constraints, or emerging doubts.
        </p>
      </div>

      {/* Suggested Prompt Chips */}
      <div>
        <span className="text-xs font-semibold text-slate-700 block mb-2">
          Test a Scenario:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_CHALLENGES.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(chip);
                handleSubmit(chip);
              }}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200 text-left disabled:opacity-50 font-medium"
            >
              "{chip}"
            </button>
          ))}
        </div>
      </div>

      {/* Question Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(question);
              }
            }}
            placeholder="Ask a 'What If?' scenario or express a lingering doubt..."
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-slate-50 text-slate-900"
          />
          <button
            onClick={() => handleSubmit(question)}
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Probe</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-600">{errorMsg}</p>
        )}
      </div>

      {/* Message History */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium">No stress-test inquiries yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Select one of the suggested chips above or type your own hypothetical dilemma.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4"
            >
              {/* Question */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold font-mono flex items-center justify-center">
                    Q
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    "{msg.question}"
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
              </div>

              {/* Direct Answer */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {msg.answer.directAnswer}
              </div>

              {/* Verdict Impact Box */}
              <div
                className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                  msg.answer.verdictImpact.verdictChanges
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-emerald-50 border-emerald-200 text-emerald-950"
                }`}
              >
                {msg.answer.verdictImpact.verdictChanges ? (
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold mb-0.5">
                    {msg.answer.verdictImpact.verdictChanges
                      ? "⚠️ Shifts Verdict Balance"
                      : "✅ Verdict Remains Robust"}
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    {msg.answer.verdictImpact.explanation}
                  </p>
                  {msg.answer.verdictImpact.recommendedShift && (
                    <div className="mt-2 font-medium text-slate-900 bg-white p-2 rounded border border-slate-200">
                      💡 Recommended Adjustment: {msg.answer.verdictImpact.recommendedShift}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Takeaway */}
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                <span className="font-semibold text-slate-800">Core Takeaway: </span>
                {msg.answer.keyTakeaway}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
