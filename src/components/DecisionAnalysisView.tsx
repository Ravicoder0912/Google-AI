import React, { useState } from "react";
import {
  Trophy,
  Scale,
  SlidersHorizontal,
  Compass,
  Skull,
  MessageSquareQuote,
  Copy,
  Printer,
  Edit3,
  Check,
  Share2,
  Calendar,
  Sparkles,
  Film,
  Dices,
  Heart,
  Eye,
  Bot,
  Globe,
  Brain,
  ExternalLink,
  Search,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  DecisionSession,
  DecisionAnalysisResult,
  ChallengeMessage,
  GutFeelingRecord,
  ScenarioExplainerResult,
  MarketIntelData,
} from "../types";
import { VerdictTab } from "./VerdictTab";
import { ProsConsTab } from "./ProsConsTab";
import { ScenarioExplainerTab } from "./ScenarioExplainerTab";
import { ComparisonMatrixTab } from "./ComparisonMatrixTab";
import { SwotTab } from "./SwotTab";
import { PreMortemTab } from "./PreMortemTab";
import { RandomizerTab } from "./RandomizerTab";
import { ChallengeTab } from "./ChallengeTab";
import { PrintReport } from "./PrintReport";
import { SecondOpinionModal } from "./SecondOpinionModal";

interface DecisionAnalysisViewProps {
  session: DecisionSession;
  onEditDecision: () => void;
  onUpdateSession: (session: DecisionSession) => void;
  onOpenChatbot?: () => void;
}

type TabType =
  | "verdict"
  | "pros_cons"
  | "scenarios"
  | "matrix"
  | "swot"
  | "pre_mortem"
  | "randomizer"
  | "challenge"
  | "market_intel";

export const DecisionAnalysisView: React.FC<DecisionAnalysisViewProps> = ({
  session,
  onEditDecision,
  onUpdateSession,
  onOpenChatbot,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("verdict");
  const [copied, setCopied] = useState(false);
  const [isSecondOpinionOpen, setIsSecondOpinionOpen] = useState(false);
  const [challengeMessages, setChallengeMessages] = useState<ChallengeMessage[]>([]);
  const [marketIntel, setMarketIntel] = useState<MarketIntelData | null>(session.analysis?.marketIntel || null);
  const [isFetchingIntel, setIsFetchingIntel] = useState(false);
  const [customSearchTopic, setCustomSearchTopic] = useState("");

  const analysis = session.analysis!;

  // Copy Markdown Summary
  const handleCopyMarkdown = () => {
    const md = `# The Tiebreaker Analysis: ${session.title}

## 🏆 The Verdict
**Winner:** ${analysis.tiebreakerVerdict.winnerOptionName} (${analysis.tiebreakerVerdict.confidenceScore}% Confidence)
> "${analysis.tiebreakerVerdict.headlineVerdict}"

### Key Rationales:
${analysis.tiebreakerVerdict.keyRationale.map((r) => `- ${r}`).join("\n")}

### Devil's Advocate Counter:
- Counter: ${analysis.tiebreakerVerdict.devilsAdvocate.counterArgument}
- Why Verdict Holds: ${analysis.tiebreakerVerdict.devilsAdvocate.whyVerdictStillHolds}

## 📊 Summary of Options
${analysis.optionsAnalysis
  .map(
    (opt) => `### ${opt.optionName}
*${opt.tagline}*
- Best For: ${opt.bestFor}
- Pros:
${opt.pros.map((p) => `  + [${p.impact.toUpperCase()}] ${p.text} (+${p.score})`).join("\n")}
- Cons:
${opt.cons.map((c) => `  - [${c.severity.toUpperCase()}] ${c.text} (${c.score})`).join("\n")}
- 1-Year Pre-Mortem Risk: ${opt.preMortem}
`
  )
  .join("\n")}

## 🗓️ 7-Day Implementation Steps:
${analysis.tiebreakerVerdict.actionPlan.map((s, i) => `${i + 1}. ${s}`).join("\n")}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  const handleUpdateOptionData = (updatedAnalysis: DecisionAnalysisResult) => {
    onUpdateSession({
      ...session,
      analysis: updatedAnalysis,
    });
  };

  const handleUpdateWeights = (weights: Record<string, number>) => {
    onUpdateSession({
      ...session,
      userCustomWeights: weights,
    });
  };

  const handleUpdateGutFeelings = (gutFeelings: GutFeelingRecord) => {
    onUpdateSession({
      ...session,
      userGutFeelings: gutFeelings,
    });
  };

  const handleUpdateScenarios = (scenarios: ScenarioExplainerResult) => {
    if (session.analysis) {
      onUpdateSession({
        ...session,
        analysis: {
          ...session.analysis,
          scenarios,
        },
      });
    }
  };

  const handleAddChallengeMessage = (msg: ChallengeMessage) => {
    setChallengeMessages((prev) => [msg, ...prev]);
  };

  // Fetch Live Google Search Grounded Market Intel
  const handleFetchMarketIntel = async (topic?: string) => {
    setIsFetchingIntel(true);
    try {
      const res = await fetch("/api/search-market-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionTitle: session.title,
          options: session.options.map((o) => o.name),
          customQuery: topic || customSearchTopic,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMarketIntel(data);
        if (session.analysis) {
          onUpdateSession({
            ...session,
            analysis: {
              ...session.analysis,
              marketIntel: data,
              groundingSources: data.sources || session.analysis.groundingSources,
            },
          });
        }
      }
    } catch (e) {
      console.error("Market intel error:", e);
    } finally {
      setIsFetchingIntel(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: "verdict", label: "The Tiebreaker Verdict", icon: Trophy },
    { id: "pros_cons", label: "Pros & Cons & Intuition", icon: Scale },
    { id: "market_intel", label: "Live Market Intelligence", icon: Globe, badge: "Google Search" },
    { id: "scenarios", label: "Scenario Explainer", icon: Film, badge: "Sim" },
    { id: "matrix", label: "Comparison Matrix", icon: SlidersHorizontal },
    { id: "swot", label: "SWOT Analysis", icon: Compass },
    { id: "pre_mortem", label: "Pre-Mortem Risk", icon: Skull },
    { id: "randomizer", label: "Random Decision Tool", icon: Dices, badge: "Tool" },
    { id: "challenge", label: "Ask 'What If?'", icon: MessageSquareQuote },
  ];

  return (
    <>
      {/* Screen Interactive View */}
      <div className="screen-only max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
        {/* Session Title Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Analyzed Dilemma
                </span>
                {session.enableHighThinking && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    High Thinking (Gemini 3.1 Pro)
                  </span>
                )}
                {session.enableSearchGrounding !== false && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Search Grounded (Gemini 3.5 Flash)
                  </span>
                )}
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(session.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">
                {session.title}
              </h1>

              {/* Options chips */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Comparing:
                </span>
                {session.options.map((opt) => (
                  <span
                    key={opt.id}
                    className={`text-xs px-2.5 py-0.5 sm:py-1 rounded-md border font-medium ${
                      opt.id === analysis.tiebreakerVerdict.winnerOptionId ||
                      opt.name.toLowerCase() === analysis.tiebreakerVerdict.winnerOptionName.toLowerCase()
                        ? "bg-indigo-50 text-indigo-900 border-indigo-200 font-bold"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    {opt.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              {onOpenChatbot && (
                <button
                  id="btn-analysis-gemini-chat"
                  onClick={onOpenChatbot}
                  className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md shadow-xs transition-colors cursor-pointer"
                  title="Ask Gemini Chatbot specific questions about this dilemma"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-600 animate-pulse shrink-0" />
                  <span>Gemini Chat</span>
                </button>
              )}

              <button
                onClick={() => setIsSecondOpinionOpen(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md shadow-xs transition-colors cursor-pointer"
                title="Audit decision for cognitive biases and blind spots"
              >
                <Eye className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span>Second Opinion</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                title="Copy formatted analysis as Markdown"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                title="Print or export as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Print / PDF</span>
                <span className="sm:hidden">Print</span>
              </button>

              <button
                onClick={onEditDecision}
                className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Google Search Grounding Verified Sources Banner */}
        {analysis.groundingSources && analysis.groundingSources.length > 0 && (
          <div className="mb-4 sm:mb-6 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-blue-900 mr-2">Google Search Grounded Citations:</span>
                <span className="text-xs text-blue-700">Live data used to verify assumptions</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {analysis.groundingSources.slice(0, 4).map((src, sIdx) => {
                const linkHref = src.uri || src.url || "#";
                return (
                  <a
                    key={sIdx}
                    href={linkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md transition-colors shadow-2xs"
                    title={linkHref}
                  >
                    <span className="truncate max-w-[140px]">{src.title || linkHref}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5 sm:mb-6 border-b border-slate-200 scroll-smooth touch-pan-x">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap border shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                      isActive ? "bg-indigo-700 text-indigo-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <div>
          {activeTab === "verdict" && (
            <VerdictTab
              analysis={analysis}
              onExploreProsCons={() => setActiveTab("pros_cons")}
              onExploreMatrix={() => setActiveTab("matrix")}
              onOpenSecondOpinion={() => setIsSecondOpinionOpen(true)}
            />
          )}

          {activeTab === "pros_cons" && (
            <ProsConsTab
              analysis={analysis}
              onUpdateOptionData={handleUpdateOptionData}
              userGutFeelings={session.userGutFeelings}
              onUpdateGutFeelings={handleUpdateGutFeelings}
            />
          )}

          {activeTab === "market_intel" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Google Search Grounded Intelligence (Gemini 3.5 Flash)</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Real-Time Web Intelligence & Market Benchmarks
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Live verification of salary ranges, company stability, cost of living, reviews, and industry trends.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFetchMarketIntel()}
                    disabled={isFetchingIntel}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isFetchingIntel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching Google...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>{marketIntel ? "Refresh Web Intel" : "Fetch Live Market Intel"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Custom Search Query Bar */}
                <div className="flex gap-2 max-w-xl mb-6">
                  <input
                    type="text"
                    value={customSearchTopic}
                    onChange={(e) => setCustomSearchTopic(e.target.value)}
                    placeholder="Specific web query (e.g. 'Austin vs Seattle tech cost of living 2025')..."
                    className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchMarketIntel(customSearchTopic)}
                    disabled={isFetchingIntel || !customSearchTopic.trim()}
                    className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                {/* Intel Content Display */}
                {marketIntel ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-slate-800 text-xs sm:text-sm leading-relaxed">
                      <p className="font-semibold text-blue-900 mb-1">Live Intelligence Summary:</p>
                      <p>{marketIntel.summary}</p>
                    </div>

                    {/* Key Findings List */}
                    {((marketIntel.findings && marketIntel.findings.length > 0) ||
                      (marketIntel.keyFacts && marketIntel.keyFacts.length > 0)) && (
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                          Verified Market Observations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(marketIntel.findings || marketIntel.keyFacts || []).map((f, fIdx) => (
                            <div
                              key={fIdx}
                              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-2.5"
                            >
                              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              <span className="text-xs sm:text-sm text-slate-700">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grounding Citations */}
                    {marketIntel.sources && marketIntel.sources.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>Google Search Verified Sources</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {marketIntel.sources.map((src, sIdx) => {
                            const linkHref = src.uri || src.url || "#";
                            return (
                              <a
                                key={sIdx}
                                href={linkHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                              >
                                <span className="truncate max-w-[220px]">{src.title || linkHref}</span>
                                <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Globe className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No live market intelligence fetched yet.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click the button above to run real-time Google Search grounding on your options.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "scenarios" && (
            <ScenarioExplainerTab
              decisionTitle={session.title}
              analysis={analysis}
              onUpdateScenarios={handleUpdateScenarios}
            />
          )}

          {activeTab === "matrix" && (
            <ComparisonMatrixTab
              analysis={analysis}
              userCustomWeights={session.userCustomWeights}
              onUpdateWeights={handleUpdateWeights}
            />
          )}

          {activeTab === "swot" && <SwotTab analysis={analysis} />}

          {activeTab === "pre_mortem" && <PreMortemTab analysis={analysis} />}

          {activeTab === "randomizer" && (
            <RandomizerTab
              initialOptions={session.options}
              decisionTitle={session.title}
            />
          )}

          {activeTab === "challenge" && (
            <ChallengeTab
              decisionTitle={session.title}
              analysis={analysis}
              messages={challengeMessages}
              onAddMessage={handleAddChallengeMessage}
            />
          )}
        </div>
      </div>

      {/* Second Opinion & Bias Audit Modal */}
      <SecondOpinionModal
        isOpen={isSecondOpinionOpen}
        onClose={() => setIsSecondOpinionOpen(false)}
        session={session}
      />

      {/* Print PDF View */}
      <div className="print-only">
        <PrintReport session={session} analysis={analysis} />
      </div>
    </>
  );
};
