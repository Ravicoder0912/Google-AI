import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { DecisionForm } from "./components/DecisionForm";
import { DecisionAnalysisView } from "./components/DecisionAnalysisView";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { TemplatesModal } from "./components/TemplatesModal";
import { RandomDecisionModal } from "./components/RandomDecisionModal";
import { GeminiChatModal } from "./components/GeminiChatModal";
import { PRESET_TEMPLATES } from "./data/templates";
import { DecisionSession, PresetTemplate, DecisionOption, DecisionAnalysisResult } from "./types";
import { Sparkles, Scale, AlertTriangle, Bot } from "lucide-react";

const STORAGE_KEY = "the_tiebreaker_history_v1";

export default function App() {
  const [history, setHistory] = useState<DecisionSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DecisionSession | null>(null);
  const [editingData, setEditingData] = useState<{
    decisionTitle: string;
    options: DecisionOption[];
    context: string;
    priorities: string[];
    riskTolerance: "conservative" | "balanced" | "aggressive";
    timeHorizon: "short_term" | "medium_term" | "long_term";
    enableSearchGrounding?: boolean;
    highThinking?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRandomizerOpen, setIsRandomizerOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (updatedHistory: DecisionSession[]) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  };

  // Run Decision Analysis
  const handleAnalyzeDecision = async (data: {
    decisionTitle: string;
    options: DecisionOption[];
    context: string;
    priorities: string[];
    riskTolerance: "conservative" | "balanced" | "aggressive";
    timeHorizon: "short_term" | "medium_term" | "long_term";
    enableSearchGrounding?: boolean;
    highThinking?: boolean;
  }) => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const res = await fetch("/api/analyze-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const analysisResult: DecisionAnalysisResult = await res.json();

      const newSession: DecisionSession = {
        id: `session-${Date.now()}`,
        title: data.decisionTitle,
        createdAt: new Date().toISOString(),
        options: data.options,
        context: data.context,
        priorities: data.priorities,
        riskTolerance: data.riskTolerance,
        timeHorizon: data.timeHorizon,
        analysis: analysisResult,
        userGutFeelings: {},
        enableSearchGrounding: data.enableSearchGrounding,
        enableHighThinking: data.highThinking,
      };

      setCurrentSession(newSession);

      // Prepend to history
      const updatedHistory = [newSession, ...history.filter((h) => h.id !== newSession.id)];
      saveHistory(updatedHistory);
    } catch (err: any) {
      console.error("Decision analysis error:", err);
      setGlobalError(err.message || "Failed to analyze decision. Please check your network or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update active session (e.g. user changes custom weights, pros/cons, gut feelings, or scenarios)
  const handleUpdateSession = (updatedSession: DecisionSession) => {
    setCurrentSession(updatedSession);
    const updatedHistory = history.map((h) => (h.id === updatedSession.id ? updatedSession : h));
    saveHistory(updatedHistory);
  };

  // Select a preset template (loads it into the form so the user can customize words/options)
  const handleSelectTemplate = (template: PresetTemplate) => {
    const formattedOptions: DecisionOption[] = template.options.map((opt, i) => ({
      id: `opt-${Date.now()}-${i + 1}`,
      name: opt.name,
      description: opt.description,
    }));

    setEditingData({
      decisionTitle: template.title,
      options: formattedOptions,
      context: template.context || "",
      priorities: template.priorities || ["High Financial ROI", "Work-Life Balance & Peace of Mind"],
      riskTolerance: template.riskTolerance || "balanced",
      timeHorizon: template.timeHorizon || "medium_term",
    });
    setCurrentSession(null);
  };

  // Start new decision
  const handleNewDecision = () => {
    setCurrentSession(null);
    setEditingData(null);
    setGlobalError(null);
  };

  // Delete single history item
  const handleDeleteSession = (sessionId: string) => {
    const updated = history.filter((h) => h.id !== sessionId);
    saveHistory(updated);
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    saveHistory([]);
    setCurrentSession(null);
    setEditingData(null);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Header
        onNewDecision={handleNewDecision}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenRandomizer={() => setIsRandomizerOpen(true)}
        historyCount={history.length}
        hasActiveAnalysis={!!currentSession?.analysis}
      />

      {/* Global Error Banner */}
      {globalError && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="text-xs font-semibold text-rose-900 hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-24 sm:pb-12">
        {currentSession && currentSession.analysis ? (
          <DecisionAnalysisView
            session={currentSession}
            onEditDecision={() => {
              setEditingData({
                decisionTitle: currentSession.title,
                options: currentSession.options,
                context: currentSession.context || "",
                priorities: currentSession.priorities,
                riskTolerance: currentSession.riskTolerance,
                timeHorizon: currentSession.timeHorizon,
                enableSearchGrounding: currentSession.enableSearchGrounding,
                highThinking: currentSession.enableHighThinking,
              });
              setCurrentSession(null);
            }}
            onUpdateSession={handleUpdateSession}
            onOpenChatbot={() => setIsChatbotOpen(true)}
          />
        ) : (
          <DecisionForm
            onSubmit={handleAnalyzeDecision}
            isLoading={isLoading}
            onSelectTemplate={handleSelectTemplate}
            templates={PRESET_TEMPLATES}
            initialData={editingData}
          />
        )}
      </main>

      {/* Floating Gemini Chatbot Launcher (Responsive: Compact icon on Mobile, Pill on Tablet/Desktop) */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        {/* Mobile Compact Circular Button */}
        <button
          id="btn-floating-gemini-chat-mobile"
          type="button"
          onClick={() => setIsChatbotOpen(true)}
          className="sm:hidden flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-full shadow-2xl border border-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
          title="Open Gemini Decision Chatbot"
        >
          <Bot className="w-5 h-5 text-indigo-400" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
          </span>
        </button>

        {/* Tablet / Desktop Pill Button */}
        <button
          id="btn-floating-gemini-chat"
          type="button"
          onClick={() => setIsChatbotOpen(true)}
          className="hidden sm:flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white rounded-full shadow-2xl hover:shadow-indigo-500/20 border border-slate-700/80 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Gemini Decision Chatbot"
        >
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-xs tracking-tight text-white flex items-center gap-1">
              <span>Ask Gemini Chat</span>
              <Sparkles className="w-3 h-3 text-indigo-400" />
            </span>
            <span className="text-[10px] text-slate-300 font-medium">Multi-Turn Strategy</span>
          </div>
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 tracking-tight">THE TIEBREAKER</span>
            <span>— Strategic Decision Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Powered by Gemini 3.5 Flash & Gemini 3.1 Pro decision intelligence
          </p>
        </div>
      </footer>

      {/* Gemini Chatbot Multi-Turn Modal */}
      <GeminiChatModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        activeSession={currentSession}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        templates={PRESET_TEMPLATES}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectSession={(session) => {
          setCurrentSession(session);
        }}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllHistory}
      />

      {/* Quick Access Randomizer Modal */}
      <RandomDecisionModal
        isOpen={isRandomizerOpen}
        onClose={() => setIsRandomizerOpen(false)}
        options={currentSession?.options}
        decisionTitle={currentSession?.title}
      />
    </div>
  );
}
