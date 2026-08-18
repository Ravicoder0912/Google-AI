export interface GroundingSource {
  title: string;
  uri: string;
  url?: string;
}

export interface MarketIntelData {
  summary: string;
  keyFacts?: string[];
  findings?: string[];
  sources: GroundingSource[];
  searchQueries?: string[];
}

export interface DecisionOption {
  id: string;
  name: string;
  description?: string;
  keyTheme?: string;
}

export interface ProItem {
  id: string;
  text: string;
  impact: "high" | "medium" | "low";
  category: string;
  score: number; // 1 to 5
}

export interface ConItem {
  id: string;
  text: string;
  severity: "high" | "medium" | "low";
  category: string;
  score: number; // -5 to -1
  mitigation: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export type GutFeelingValue = "excited" | "positive" | "neutral" | "uneasy" | "dread";

export interface GutFeelingEntry {
  feeling: GutFeelingValue;
  notes?: string;
  timestamp: string;
}

export type GutFeelingRecord = Record<string, GutFeelingEntry>;

export interface OptionScenarioNarrative {
  optionId: string;
  optionName: string;
  tagline: string;
  shortTerm: {
    timeframe: string; // e.g. "Months 1–6"
    narrative: string; // vivid story of the transition period
    keyMilestone: string;
    frictionPoints: string[];
    emotionalState: string;
  };
  longTerm: {
    timeframe: string; // e.g. "Years 2–5"
    narrative: string; // compounding trajectory story
    ultimateOutcome: string;
    secondOrderEffects: string[];
    compoundedAdvantage: string;
  };
  dayInTheLife: string; // "A typical Tuesday under this choice..."
  criticalForkInTheRoad: string; // The crucial decision or catalyst that determines success
  bestCaseTrajectory: string;
  worstCaseTrajectory: string;
}

export interface ScenarioExplainerResult {
  decisionTitle: string;
  scenarios: OptionScenarioNarrative[];
  comparativeTakeaway: string;
}

export interface OptionAnalysis {
  optionId: string;
  optionName: string;
  tagline: string;
  pros: ProItem[];
  cons: ConItem[];
  swot: SwotAnalysis;
  preMortem: string;
  bestFor: string;
}

export interface MatrixCriterion {
  id: string;
  name: string;
  weight: number; // 1 to 5
  description: string;
}

export interface CriterionScore {
  criteriaId: string;
  score: number; // 1 to 10
  justification: string;
}

export interface OptionScoreGroup {
  optionId: string;
  scoresByCriteria: CriterionScore[];
}

export interface ComparisonMatrix {
  criteria: MatrixCriterion[];
  scores: OptionScoreGroup[];
}

export interface TiebreakerVerdict {
  winnerOptionId: string;
  winnerOptionName: string;
  confidenceScore: number;
  headlineVerdict: string;
  keyRationale: string[];
  devilsAdvocate: {
    counterArgument: string;
    whyVerdictStillHolds: string;
  };
  actionPlan: string[];
  gutCheckQuestion: string;
}

export interface DecisionAnalysisResult {
  summary: string;
  optionsAnalysis: OptionAnalysis[];
  comparisonMatrix: ComparisonMatrix;
  tiebreakerVerdict: TiebreakerVerdict;
  scenarios?: ScenarioExplainerResult;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
  marketIntel?: MarketIntelData;
  modelUsed?: string;
  highThinkingUsed?: boolean;
}

export interface DecisionSession {
  id: string;
  title: string;
  createdAt: string;
  options: DecisionOption[];
  context: string;
  priorities: string[];
  riskTolerance: "conservative" | "balanced" | "aggressive";
  timeHorizon: "short_term" | "medium_term" | "long_term";
  enableSearchGrounding?: boolean;
  enableHighThinking?: boolean;
  analysis?: DecisionAnalysisResult;
  userCustomWeights?: Record<string, number>;
  userEditedProsCons?: Record<string, { pros: ProItem[]; cons: ConItem[] }>;
  userGutFeelings?: GutFeelingRecord;
}

export interface ChallengeMessage {
  id: string;
  question: string;
  answer: {
    directAnswer: string;
    verdictImpact: {
      verdictChanges: boolean;
      explanation: string;
      recommendedShift: string;
    };
    keyTakeaway: string;
  };
  timestamp: string;
}

export interface PresetTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  options: { name: string; description: string }[];
  context: string;
  priorities: string[];
  riskTolerance: "conservative" | "balanced" | "aggressive";
  timeHorizon: "short_term" | "medium_term" | "long_term";
}

export interface CognitiveBiasItem {
  name: string;
  severity: "high" | "medium" | "low";
  explanation: string;
  mitigationPrompt: string;
}

export interface BlindSpotItem {
  area: string;
  description: string;
  unaskedQuestion: string;
}

export interface AlternativePathItem {
  title: string;
  description: string;
  advantage: string;
}

export interface SecondOpinionResult {
  overallRiskLevel: "low" | "moderate" | "high" | "critical";
  executiveVerdict: string;
  identifiedBiases: CognitiveBiasItem[];
  blindSpots: BlindSpotItem[];
  alternativePaths: AlternativePathItem[];
  pressureTestQuestions: string[];
  recalibratedAdvice: string;
}

export type ChatRoleType = "user" | "model";

export type BotPersonaType =
  | "tiebreaker"
  | "devils_advocate"
  | "empathetic_mentor"
  | "financial_roi"
  | "creative_wildcard";

export type GeminiModelType =
  | "gemini-3.5-flash"
  | "gemini-3.1-pro-preview"
  | "gemini-3.1-flash-lite";

export interface ChatMessage {
  id: string;
  role: ChatRoleType;
  content: string;
  timestamp: string;
  persona?: BotPersonaType;
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
  highThinkingUsed?: boolean;
}
