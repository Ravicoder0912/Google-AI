import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  HeartHandshake,
  TrendingUp,
  Lightbulb,
  Trash2,
  Download,
  Copy,
  Check,
  Loader2,
  Cpu,
  ChevronDown,
  Globe,
  Brain,
  ExternalLink,
  Search,
} from "lucide-react";
import Markdown from "react-markdown";
import {
  ChatMessage,
  BotPersonaType,
  GeminiModelType,
  DecisionSession,
  GroundingSource,
} from "../types";

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession?: DecisionSession | null;
}

interface PersonaConfig {
  id: BotPersonaType;
  name: string;
  badge: string;
  tagline: string;
  icon: React.ElementType;
  accentColor: string;
  bgLight: string;
  borderLight: string;
  samplePrompts: string[];
}

const PERSONAS: PersonaConfig[] = [
  {
    id: "tiebreaker",
    name: "The Tiebreaker",
    badge: "Lead Strategist",
    tagline: "Decisive, bold, and cuts through analysis paralysis with crystal clarity.",
    icon: Sparkles,
    accentColor: "text-indigo-600",
    bgLight: "bg-indigo-50",
    borderLight: "border-indigo-200",
    samplePrompts: [
      "Which option is clearly the winner and why?",
      "If you had only 5 minutes to decide, what's your call?",
      "What is the single most important tradeoff here?",
      "What are the 3 steps I must take in the next 7 days?",
    ],
  },
  {
    id: "devils_advocate",
    name: "Devil's Advocate",
    badge: "Risk & Trap Hunter",
    tagline: "Fearlessly probes worst-case traps, hidden costs, and blind spots.",
    icon: ShieldAlert,
    accentColor: "text-rose-600",
    bgLight: "bg-rose-50",
    borderLight: "border-rose-200",
    samplePrompts: [
      "What is the biggest assumption in my plan that could fail?",
      "How could this decision blow up in my face in 12 months?",
      "Am I suffering from sunk cost or fear of missing out?",
      "What is the worst-case scenario no one is talking about?",
    ],
  },
  {
    id: "empathetic_mentor",
    name: "Empathetic Mentor",
    badge: "Life & Wellbeing",
    tagline: "Focuses on personal happiness, emotional peace, and burnout prevention.",
    icon: HeartHandshake,
    accentColor: "text-emerald-600",
    bgLight: "bg-emerald-50",
    borderLight: "border-emerald-200",
    samplePrompts: [
      "Which choice will give me the most peace of mind?",
      "How do I balance this decision with family and mental health?",
      "Which path prevents burnout and regret 5 years from now?",
      "How can I trust my gut feeling on this?",
    ],
  },
  {
    id: "financial_roi",
    name: "Financial & ROI",
    badge: "Economic Strategist",
    tagline: "Evaluates opportunity costs, cash flow risks, and upside leverage.",
    icon: TrendingUp,
    accentColor: "text-amber-600",
    bgLight: "bg-amber-50",
    borderLight: "border-amber-200",
    samplePrompts: [
      "What is the true financial opportunity cost here?",
      "How do I maximize my leverage before signing or committing?",
      "What is the safest financial safety net for this path?",
      "What is the realistic risk-to-reward ratio?",
    ],
  },
  {
    id: "creative_wildcard",
    name: "Creative Wildcard",
    badge: "Lateral Innovator",
    tagline: "Breaks binary either/or traps with clever hybrid options & pilot tests.",
    icon: Lightbulb,
    accentColor: "text-purple-600",
    bgLight: "bg-purple-50",
    borderLight: "border-purple-200",
    samplePrompts: [
      "Can you design a hybrid path that combines the best of both?",
      "How can I run a 30-day low-risk trial experiment first?",
      "What is an unorthodox third option I haven't considered?",
      "How can I make this decision reversible?",
    ],
  },
];

const MODEL_OPTIONS: { id: GeminiModelType; label: string; role: string; desc: string }[] = [
  {
    id: "gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    role: "General & Search Grounded",
    desc: "Default balanced engine with Google Search grounding support.",
  },
  {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro Preview",
    role: "Complex & Thinking Mode",
    desc: "Deep multi-step thinking mode with game theory calibration.",
  },
  {
    id: "gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash Lite",
    role: "Low-Latency Instant",
    desc: "Ultra-fast response for rapid brainstorming and low latency.",
  },
];

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  activeSession,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<BotPersonaType>("tiebreaker");
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>("gemini-3.5-flash");
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(true);
  const [highThinking, setHighThinking] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      const activePersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];
      const initialGreeting: ChatMessage = {
        id: "msg-init",
        role: "model",
        content: activeSession?.title
          ? `👋 **Hello! I'm ${activePersona.name}.**\n\nI see you are analyzing: **"${activeSession.title}"**.\n\nAsk me anything — whether you want me to search live market data, stress-test your options, design a clever compromise, or make the definitive winning call!`
          : `👋 **Hello! I'm ${activePersona.name}** (${activePersona.badge}).\n\n${activePersona.tagline}\n\nWhat decision or dilemma is on your mind today? Let's break it down together!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        persona: selectedPersona,
        modelUsed: selectedModel,
      };
      setMessages([initialGreeting]);
    }
  }, [selectedPersona, activeSession]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPersonaConfig = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];
  const PersonaIcon = currentPersonaConfig.icon;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText("");
    setIsLoading(true);

    try {
      // Build decision context if enabled and available
      const decisionContextPayload =
        includeContext && activeSession
          ? {
              title: activeSession.title,
              context: activeSession.context,
              priorities: activeSession.priorities,
              options: activeSession.options,
              winningOption: activeSession.analysis?.tiebreakerVerdict?.winnerOptionName,
              verdictSummary: activeSession.analysis?.tiebreakerVerdict?.headlineVerdict,
            }
          : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          persona: selectedPersona,
          model: selectedModel,
          decisionContext: decisionContextPayload,
          enableSearchGrounding,
          highThinking,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response from Gemini Chatbot.");
      }

      const botResponse = await res.json();
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        role: "model",
        content: botResponse.content,
        timestamp: botResponse.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        persona: selectedPersona,
        modelUsed: botResponse.modelUsed || selectedModel,
        groundingSources: botResponse.groundingSources,
        searchQueries: botResponse.searchQueries,
        highThinkingUsed: botResponse.highThinkingUsed || (selectedModel === "gemini-3.1-pro-preview" && highThinking),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: "model",
        content: `⚠️ **Error:** ${err.message || "Failed to reach Gemini. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        persona: selectedPersona,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    const activePersona = PERSONAS.find((p) => p.id === selectedPersona) || PERSONAS[0];
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "model",
        content: `✨ **Chat history reset.** I am ${activePersona.name} (${activePersona.badge}). How can I assist you with your decision?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        persona: selectedPersona,
        modelUsed: selectedModel,
      },
    ]);
  };

  const handleCopyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportChat = () => {
    let md = `# The Tiebreaker - Gemini Chatbot Session\n\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Persona:** ${currentPersonaConfig.name} (${currentPersonaConfig.badge})\n`;
    md += `**Model:** ${selectedModel}\n`;
    if (activeSession?.title) {
      md += `**Decision Context:** ${activeSession.title}\n`;
    }
    md += `\n---\n\n`;

    messages.forEach((m) => {
      const author = m.role === "user" ? "👤 You" : `🤖 Gemini (${currentPersonaConfig.name})`;
      md += `### ${author} [${m.timestamp}]\n\n${m.content}\n\n`;
      if (m.groundingSources && m.groundingSources.length > 0) {
        md += `**Grounding Sources:**\n`;
        m.groundingSources.forEach((s) => {
          const srcLink = s.uri || s.url || "#";
          md += `- [${s.title || srcLink}](${srcLink})\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="gemini-chat-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-4xl h-full sm:h-[90vh] sm:max-h-[850px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-3.5 sm:px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight truncate">
                  Gemini Decision Chat
                </h3>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shrink-0">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Interactive strategic sparring & instant advice powered by Google Gemini
              </p>
            </div>
          </div>

          {/* Action Header Tools */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Model Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Select Gemini Model"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">
                  {MODEL_OPTIONS.find((m) => m.id === selectedModel)?.label}
                </span>
                <span className="sm:hidden">
                  {selectedModel === "gemini-3.1-pro-preview" ? "Pro" : selectedModel === "gemini-3.1-flash-lite" ? "Lite" : "Flash"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showModelDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Select Gemini Engine
                  </div>
                  {MODEL_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer ${
                        selectedModel === m.id
                          ? "bg-indigo-50 border border-indigo-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Cpu
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          selectedModel === m.id ? "text-indigo-600" : "text-slate-400"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{m.label}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {m.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Chat */}
            <button
              type="button"
              onClick={handleExportChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Export conversation to Markdown"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear Chat */}
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Toggles Bar: Personas, Grounding & Thinking */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 overflow-x-auto shrink-0 touch-pan-x">
          {/* Persona selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline mr-1">
              Role:
            </span>
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPersona === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPersona(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? `${p.bgLight} ${p.accentColor} ${p.borderLight} border shadow-xs scale-102`
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? p.accentColor : "text-slate-400"}`} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Engine Controls: Google Search Grounding & High Thinking */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Search Grounding Toggle */}
            <button
              type="button"
              onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                enableSearchGrounding
                  ? "bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-300"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Google Search Grounding with Gemini 3.5 Flash"
            >
              <Globe className={`w-3 h-3 ${enableSearchGrounding ? "text-indigo-600" : "text-slate-400"}`} />
              <span>Search Grounding</span>
              {enableSearchGrounding && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>}
            </button>

            {/* High Thinking Toggle */}
            <button
              type="button"
              onClick={() => setHighThinking(!highThinking)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                highThinking
                  ? "bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-300"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Deep High-Thinking with Gemini 3.1 Pro (ThinkingLevel.HIGH)"
            >
              <Brain className={`w-3 h-3 ${highThinking ? "text-purple-600" : "text-slate-400"}`} />
              <span>Thinking Mode</span>
              {highThinking && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>}
            </button>

            {/* Context Grounding Pill */}
            {activeSession?.title && (
              <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] font-medium truncate max-w-[120px]">
                  {activeSession.title}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const msgPersonaConfig =
              PERSONAS.find((p) => p.id === msg.persona) || currentPersonaConfig;
            const MsgIcon = msgPersonaConfig.icon;

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                } animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                    isUser
                      ? "bg-slate-800 text-white"
                      : `${msgPersonaConfig.bgLight} ${msgPersonaConfig.borderLight} border text-indigo-600`
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <MsgIcon className={`w-4 h-4 ${msgPersonaConfig.accentColor}`} />}
                </div>

                {/* Bubble */}
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-600">
                      {isUser ? "You" : `${msgPersonaConfig.name}`}
                    </span>
                    {!isUser && msg.modelUsed && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-mono">
                        {msg.modelUsed}
                      </span>
                    )}
                    {!isUser && msg.highThinkingUsed && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-semibold border border-purple-200 flex items-center gap-0.5">
                        <Brain className="w-2.5 h-2.5" />
                        Thinking Mode
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-slate-900 text-white rounded-tr-none shadow-md"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-headings:font-bold prose-headings:my-2 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-slate-900">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}

                    {/* Grounding Sources & Search Citations */}
                    {!isUser && msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <Globe className="w-3 h-3 text-indigo-500" />
                          <span>Google Search Grounding Citations</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.groundingSources.map((source, sIdx) => {
                            const linkHref = source.uri || source.url || "#";
                            return (
                              <a
                                key={sIdx}
                                href={linkHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-colors"
                                title={linkHref}
                              >
                                <span className="truncate max-w-[180px]">{source.title || linkHref}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0 text-indigo-500" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Search Queries Used */}
                    {!isUser && msg.searchQueries && msg.searchQueries.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                        <Search className="w-2.5 h-2.5 text-slate-400" />
                        <span>Searched:</span>
                        {msg.searchQueries.map((q, qIdx) => (
                          <span key={qIdx} className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-mono">
                            "{q}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Copy Button on Model Messages */}
                  {!isUser && (
                    <div className="flex items-center justify-end px-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Copy response"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-start animate-in fade-in duration-200">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${currentPersonaConfig.bgLight} ${currentPersonaConfig.borderLight} border`}
              >
                <PersonaIcon className={`w-4 h-4 ${currentPersonaConfig.accentColor} animate-pulse`} />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-500 font-medium">
                  {currentPersonaConfig.name} is {highThinking ? "performing deep thinking" : enableSearchGrounding ? "grounding via Google Search" : "thinking"} using {selectedModel}...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Quick Prompts:
          </span>
          {currentPersonaConfig.samplePrompts.map((promptText, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleSendMessage(promptText)}
              disabled={isLoading}
              className="text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Bottom Input Box */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all p-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${currentPersonaConfig.name} anything about your decision... (Press Enter to send)`}
              rows={2}
              className="w-full resize-none bg-transparent border-0 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-0 p-1"
            />

            <button
              type="button"
              id="btn-send-chat"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
            <span>
              <strong>Shift + Enter</strong> for new line • <strong>Enter</strong> to send
            </span>
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Powered by Google Gemini
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
