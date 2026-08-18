import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-flash-latest",
];

export interface GroundingSource {
  title: string;
  uri: string;
}

// Resilient JSON parser
function safeParseJSON(input: string | { text: string; modelUsed: string }): any {
  const text = typeof input === "object" && input !== null ? input.text : String(input || "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    // Strip markdown codeblocks e.g. ```json ... ```
    const cleaned = text.replace(/^[^{[]*```(?:json)?\s*/i, "").replace(/\s*```[^}\]]*$/i, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      }
      const firstBracket = text.indexOf("[");
      const lastBracket = text.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        return JSON.parse(text.slice(firstBracket, lastBracket + 1));
      }
      throw new Error("Unable to parse model JSON output.");
    }
  }
}

// Resilient API Caller with exponential backoff, thinking level & search grounding support
async function generateWithRetryAndFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  enableSearchGrounding?: boolean;
  highThinking?: boolean;
}): Promise<{
  text: string;
  modelUsed: string;
  groundingSources?: GroundingSource[];
  searchQueries?: string[];
  highThinkingUsed?: boolean;
}> {
  const ai = getAIClient();

  // Model selection hierarchy based on intent:
  // - High thinking: gemini-3.1-pro-preview with ThinkingLevel.HIGH
  // - Search grounding: gemini-3.5-flash with googleSearch tool
  // - Fast tasks: gemini-3.1-flash-lite for low latency
  // - General tasks: gemini-3.5-flash
  let preferred = params.preferredModel;
  if (!preferred) {
    if (params.highThinking) {
      preferred = "gemini-3.1-pro-preview";
    } else if (params.enableSearchGrounding) {
      preferred = "gemini-3.5-flash";
    } else {
      preferred = "gemini-3.5-flash";
    }
  }

  const modelsToTry = [preferred, ...CANDIDATE_MODELS.filter((m) => m !== preferred)];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Requesting model "${model}" (attempt ${attempt + 1}/${maxRetries + 1})...`);

        // Build config payload
        const runConfig: any = { ...(params.config || {}) };

        // Apply High Thinking if enabled or requested with gemini-3.1-pro-preview
        if (params.highThinking && model.includes("pro")) {
          runConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH,
          };
          // Per instructions: Do not set maxOutputTokens when using ThinkingLevel.HIGH
          delete runConfig.maxOutputTokens;
        }

        // Apply Google Search Grounding if enabled
        if (params.enableSearchGrounding) {
          runConfig.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: runConfig,
        });

        if (response && response.text) {
          // Extract Grounding metadata if available
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const queries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
          const groundingSources: GroundingSource[] = chunks
            .filter((c: any) => c.web?.uri)
            .map((c: any) => ({
              title: c.web.title || c.web.uri,
              uri: c.web.uri,
            }));

          return {
            text: response.text,
            modelUsed: model,
            groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
            searchQueries: queries.length > 0 ? queries : undefined,
            highThinkingUsed: params.highThinking && model.includes("pro"),
          };
        }
        throw new Error("Received empty response text from Gemini API.");
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || "");
        const status = err?.status || err?.code || "";
        const isTransient =
          status === 503 ||
          status === "UNAVAILABLE" ||
          status === 429 ||
          status === "RESOURCE_EXHAUSTED" ||
          msg.includes("503") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("Resource has been exhausted") ||
          msg.includes("overloaded") ||
          msg.includes("quota") ||
          msg.includes("temporar");

        console.warn(`[Gemini API] Error with model "${model}" (attempt ${attempt + 1}): ${msg}`);

        if (isTransient && attempt < maxRetries) {
          const delay = 400 + Math.random() * 300;
          console.log(`[Gemini API] Retrying with model "${model}" after ${Math.round(delay)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("Failed to generate response after attempting fallback models.");
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: Suggest distinct options based on a dilemma
app.post("/api/suggest-options", async (req, res) => {
  try {
    const { decisionTitle, context } = req.body;
    if (!decisionTitle) {
      return res.status(400).json({ error: "decisionTitle is required" });
    }

    const prompt = `You are a brilliant, ultra-creative, and brutally honest life-and-career strategist.
A real person is facing this dilemma:
Decision Dilemma: "${decisionTitle}"
Extra Context / Background: "${context || "None provided"}"

Generate 2 to 4 bold, distinctly different options that are:
1. EXTREMELY CLEAR & SIMPLE TO UNDERSTAND (use plain, everyday words that a 12-year-old would get immediately).
2. VIVID, DRAMATIC & EXAGGERATED (paint a colorful picture of what this choice really stands for, like the "Go Big or Go Home Rocketship" vs. "The Safe Golden Harbor").
3. RICH IN DETAIL (explain what the path actually feels like and requires).

Output 2 to 4 distinct options with catchy, crystal-clear names and detailed 2-sentence descriptions.`;

    const rawText = await generateWithRetryAndFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are a lively, crystal-clear, and colorful decision coach. Write in punchy, everyday plain English with high energy, vivid imagery, and zero boring corporate jargon.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Punchy, descriptive, memorable name" },
                  description: { type: Type.STRING, description: "Vivid, detailed, easy-to-understand 2-sentence breakdown of this path" },
                  keyTheme: { type: Type.STRING, description: "Short punchy keyword e.g. High Growth, Total Safety, Freedom, Big Money" },
                },
                required: ["name", "description", "keyTheme"],
              },
            },
          },
          required: ["suggestedOptions"],
        },
      },
    });

    const result = safeParseJSON(rawText);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/suggest-options:", error);
    res.status(500).json({
      error: error.message || "The decision model is temporarily busy. Please try again in a moment.",
    });
  }
});

// Endpoint: Low-Latency Quick Pro / Con suggestion (gemini-3.1-flash-lite)
app.post("/api/quick-pro-con", async (req, res) => {
  try {
    const { decisionTitle, optionName, type = "pro", context = "" } = req.body;
    if (!decisionTitle || !optionName) {
      return res.status(400).json({ error: "decisionTitle and optionName are required" });
    }

    const prompt = `Decision Dilemma: "${decisionTitle}"
Option: "${optionName}"
Context: "${context}"
Requested Item Type: "${type === "con" ? "CON / DOWNSIDE" : "PRO / BENEFIT"}"

Generate 1 punchy, ultra-clear, real-world ${type === "con" ? "con with a mitigation tip" : "pro with high impact"} for this specific option.
Use simple, everyday plain English with vivid clarity.`;

    const raw = await generateWithRetryAndFallback({
      contents: prompt,
      preferredModel: "gemini-3.1-flash-lite", // Low-latency fast model
      config: {
        systemInstruction: "You are a fast, sharp decision coach. Return strictly valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Punchy 1-2 sentence statement" },
            impactOrSeverity: { type: Type.STRING, description: "high | medium | low" },
            category: { type: Type.STRING, description: "e.g. Financial, Career, Well-being, Freedom, Risk" },
            score: { type: Type.NUMBER, description: type === "con" ? "-5 to -1" : "1 to 5" },
            mitigation: { type: Type.STRING, description: "Mitigation tip if con, or amplifier if pro" },
          },
          required: ["text", "impactOrSeverity", "category", "score"],
        },
      },
    });

    const parsed = safeParseJSON(raw);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/quick-pro-con:", error);
    res.status(500).json({ error: error.message || "Failed to generate quick item" });
  }
});

// Endpoint: Real-time Google Search Grounding for Market & Real-World Facts (gemini-3.5-flash + googleSearch)
app.post("/api/search-market-intel", async (req, res) => {
  try {
    const { decisionTitle, options = [], context = "" } = req.body;
    if (!decisionTitle) {
      return res.status(400).json({ error: "decisionTitle is required." });
    }

    const prompt = `You are a real-time market intelligence analyst.
Conduct live Google Search verification to gather up-to-date facts, compensation/cost data, reviews, recent trends, or benchmark statistics for:
Decision Dilemma: "${decisionTitle}"
Options being compared: ${Array.isArray(options) ? options.map((o: any) => o.name || o).join(", ") : "Options"}
Background Context: "${context}"

Provide a concise, grounded factual briefing with:
1. SUMMARY: A 2-paragraph real-world factual briefing highlighting current market rates, cost of living, industry trends, or latest community consensus.
2. 3 to 5 KEY VERIFIED FACTS: Concrete data points, verified numbers, or recent market realities discovered via search.`;

    const raw = await generateWithRetryAndFallback({
      contents: prompt,
      preferredModel: "gemini-3.5-flash",
      enableSearchGrounding: true, // Google Search tool enabled
      config: {
        systemInstruction: "You are a real-time research analyst. Use Google Search grounding to deliver up-to-date, grounded facts and cite realistic findings in clear English.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "keyFacts"],
        },
      },
    });

    const parsed = safeParseJSON(raw);
    res.json({
      summary: parsed.summary,
      keyFacts: parsed.keyFacts,
      sources: raw.groundingSources || [],
      searchQueries: raw.searchQueries || [],
      modelUsed: raw.modelUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/search-market-intel:", error);
    res.status(500).json({ error: error.message || "Failed to fetch live search intelligence" });
  }
});

// Endpoint: Full Decision Analysis (Pros/Cons, Comparison Matrix, SWOT, Tiebreaker Verdict)
app.post("/api/analyze-decision", async (req, res) => {
  try {
    const {
      decisionTitle,
      options,
      context = "",
      priorities = [],
      riskTolerance = "balanced",
      timeHorizon = "medium_term",
      enableSearchGrounding = false,
      highThinking = false,
    } = req.body;

    if (!decisionTitle || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: "decisionTitle and at least 2 options are required.",
      });
    }

    const prompt = `Act as 'THE TIEBREAKER' — a wildly insightful, brutally honest, and deeply caring master advisor who cuts through overthinking with vivid clarity!

Decision Question: "${decisionTitle}"
User's Real-Life Context: "${context}"
User's Stated Priorities: ${priorities.length > 0 ? priorities.join(", ") : "Balanced happy life"}
Risk Tolerance: "${riskTolerance}"
Time Horizon: "${timeHorizon}"
${enableSearchGrounding ? "NOTE: Real-time Google Search grounding is enabled. Ground your tradeoffs, costs, and market projections in real-world facts." : ""}
${highThinking ? "NOTE: High Reasoning Thinking Mode is activated. Perform rigorous multi-step game-theory and second-order impact modeling." : ""}

Options to compare:
${options.map((opt: any, idx: number) => `${idx + 1}. Option ID: "${opt.id}", Name: "${opt.name}", Notes: "${opt.description || ""}"`).join("\n")}

CRITICAL INSTRUCTIONS FOR TONE & DEPTH:
1. USE SIMPLE, EVERYDAY WORDS: Ban corporate/academic jargon (no "synergy", "paradigm", "temporal friction"). Talk like an energetic, smart best friend giving the absolute truth over coffee.
2. BE VIVID, DRAMATIC & EXAGGERATED: Paint unforgettable, colorful word-pictures and funny/relatable analogies (e.g., "riding a rocket with no brakes", "eating plain oatmeal for 10 years", "buying a winning lottery ticket but forgetting to cash it").
3. BE ULTRA-DETAILED & SPECIFIC: Provide deep, rich, comprehensive explanations for every point so the user truly feels the exact consequences, emotional reality, and physical daily routine of each option.

Deliver a complete, rich JSON package containing:
1. SUMMARY: A dramatic, high-energy executive summary breaking down the epic tug-of-war at the heart of this choice.
2. FOR EACH OPTION:
   - Tagline: A punchy, hilarious, or unforgettable 1-liner summary.
   - 3 to 5 Pros: Detailed, super-clear explanations of the best perks with high impact scores.
   - 3 to 5 Cons: Raw, honest, eye-opening breakdowns of the biggest headaches, plus a practical "life-saver" mitigation trick.
   - Full SWOT: 3 to 4 juicy, plain-English points each for Strengths, Weaknesses, Opportunities, Threats.
   - Pre-Mortem: A dramatic, blow-by-blow story of how this could crash and burn in 1 year if ignored ("If this blows up in your face in 12 months, here is the exact disaster that happened...").
   - "Best for" profile: Exactly which type of human being should pick this path.
3. SCENARIO FORECASTING:
   - Short-Term (Months 1–6): Emotional rollercoaster, transition pains, first big win.
   - Long-Term (Years 2–5): The ultimate dream (or nightmare) compound effect.
   - Day in the Life: A vivid, step-by-step narrative of a typical Tuesday living this choice (from morning alarm to evening exhaustion or celebration).
   - Critical Fork in the Road: The make-or-break moment where everything is on the line.
   - Best-Case vs Worst-Case Trajectories: The wildest heavenly outcome vs the most disastrous nightmare scenario.
4. SIDE-BY-SIDE MATRIX: 4 to 6 simple criteria with scores (1-10) and punchy justifications.
5. THE DEFINITIVE TIEBREAKER VERDICT:
   - Pick ONE clear, uncompromising winner option.
   - Confidence Score (75-98%).
   - Headline Verdict: A bold, memorable ruling in plain English.
   - 3 to 4 Key Rationales: Irrefutable, common-sense reasons why this option wins.
   - Devil's Advocate Challenge: The scariest counter-argument and why the verdict still stands tall.
   - 3 Action Steps: Concrete, easy things to do in the next 7 days.
   - Psychological "Gut Check" Question: A piercing, emotional litmus test question.`;

    const preferredModel = highThinking
      ? "gemini-3.1-pro-preview"
      : enableSearchGrounding
      ? "gemini-3.5-flash"
      : "gemini-3.5-flash";

    const rawResult = await generateWithRetryAndFallback({
      contents: prompt,
      preferredModel,
      highThinking: Boolean(highThinking),
      enableSearchGrounding: Boolean(enableSearchGrounding),
      config: {
        systemInstruction: "You are The Tiebreaker: an ultra-engaging, crystal-clear, high-energy decision coach. Use simple words, dramatic metaphors, deep practical detail, and zero boring jargon. Return strictly valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "High-energy, dramatic, simple-word breakdown of the core dilemma.",
            },
            optionsAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  optionId: { type: Type.STRING },
                  optionName: { type: Type.STRING },
                  tagline: { type: Type.STRING },
                  pros: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        impact: { type: Type.STRING, description: "high | medium | low" },
                        category: { type: Type.STRING },
                        score: { type: Type.NUMBER, description: "Value from 1 to 5" },
                      },
                      required: ["id", "text", "impact", "category", "score"],
                    },
                  },
                  cons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        severity: { type: Type.STRING, description: "high | medium | low" },
                        category: { type: Type.STRING },
                        score: { type: Type.NUMBER, description: "Value from -5 to -1" },
                        mitigation: { type: Type.STRING },
                      },
                      required: ["id", "text", "severity", "category", "score", "mitigation"],
                    },
                  },
                  swot: {
                    type: Type.OBJECT,
                    properties: {
                      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                      opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                      threats: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["strengths", "weaknesses", "opportunities", "threats"],
                  },
                  preMortem: { type: Type.STRING },
                  bestFor: { type: Type.STRING },
                },
                required: ["optionId", "optionName", "tagline", "pros", "cons", "swot", "preMortem", "bestFor"],
              },
            },
            scenarios: {
              type: Type.OBJECT,
              properties: {
                decisionTitle: { type: Type.STRING },
                comparativeTakeaway: { type: Type.STRING },
                scenarios: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      optionId: { type: Type.STRING },
                      optionName: { type: Type.STRING },
                      tagline: { type: Type.STRING },
                      shortTerm: {
                        type: Type.OBJECT,
                        properties: {
                          timeframe: { type: Type.STRING },
                          narrative: { type: Type.STRING },
                          keyMilestone: { type: Type.STRING },
                          frictionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                          emotionalState: { type: Type.STRING },
                        },
                        required: ["timeframe", "narrative", "keyMilestone", "frictionPoints", "emotionalState"],
                      },
                      longTerm: {
                        type: Type.OBJECT,
                        properties: {
                          timeframe: { type: Type.STRING },
                          narrative: { type: Type.STRING },
                          ultimateOutcome: { type: Type.STRING },
                          secondOrderEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                          compoundedAdvantage: { type: Type.STRING },
                        },
                        required: ["timeframe", "narrative", "ultimateOutcome", "secondOrderEffects", "compoundedAdvantage"],
                      },
                      dayInTheLife: { type: Type.STRING },
                      criticalForkInTheRoad: { type: Type.STRING },
                      bestCaseTrajectory: { type: Type.STRING },
                      worstCaseTrajectory: { type: Type.STRING },
                    },
                    required: [
                      "optionId",
                      "optionName",
                      "tagline",
                      "shortTerm",
                      "longTerm",
                      "dayInTheLife",
                      "criticalForkInTheRoad",
                      "bestCaseTrajectory",
                      "worstCaseTrajectory",
                    ],
                  },
                },
              },
              required: ["decisionTitle", "comparativeTakeaway", "scenarios"],
            },
            comparisonMatrix: {
              type: Type.OBJECT,
              properties: {
                criteria: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      weight: { type: Type.NUMBER, description: "1 to 5" },
                      description: { type: Type.STRING },
                    },
                    required: ["id", "name", "weight", "description"],
                  },
                },
                scores: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      optionId: { type: Type.STRING },
                      scoresByCriteria: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            criteriaId: { type: Type.STRING },
                            score: { type: Type.NUMBER, description: "1 to 10" },
                            justification: { type: Type.STRING },
                          },
                          required: ["criteriaId", "score", "justification"],
                        },
                      },
                    },
                    required: ["optionId", "scoresByCriteria"],
                  },
                },
              },
              required: ["criteria", "scores"],
            },
            tiebreakerVerdict: {
              type: Type.OBJECT,
              properties: {
                winnerOptionId: { type: Type.STRING },
                winnerOptionName: { type: Type.STRING },
                confidenceScore: { type: Type.NUMBER, description: "60 to 98" },
                headlineVerdict: { type: Type.STRING },
                keyRationale: { type: Type.ARRAY, items: { type: Type.STRING } },
                devilsAdvocate: {
                  type: Type.OBJECT,
                  properties: {
                    counterArgument: { type: Type.STRING },
                    whyVerdictStillHolds: { type: Type.STRING },
                  },
                  required: ["counterArgument", "whyVerdictStillHolds"],
                },
                actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                gutCheckQuestion: { type: Type.STRING },
              },
              required: [
                "winnerOptionId",
                "winnerOptionName",
                "confidenceScore",
                "headlineVerdict",
                "keyRationale",
                "devilsAdvocate",
                "actionPlan",
                "gutCheckQuestion",
              ],
            },
          },
          required: ["summary", "optionsAnalysis", "scenarios", "comparisonMatrix", "tiebreakerVerdict"],
        },
      },
    });

    const parsed = safeParseJSON(rawResult);
    parsed.modelUsed = rawResult.modelUsed;
    parsed.highThinkingUsed = rawResult.highThinkingUsed;
    parsed.groundingSources = rawResult.groundingSources;
    parsed.searchQueries = rawResult.searchQueries;

    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/analyze-decision:", error);
    res.status(500).json({ error: error.message || "Failed to analyze decision." });
  }
});

// Endpoint: Follow-up deep dive / Challenge the decision
app.post("/api/challenge-decision", async (req, res) => {
  try {
    const { decisionTitle, currentAnalysis, userQuestion, highThinking = false } = req.body;
    if (!decisionTitle || !userQuestion) {
      return res.status(400).json({ error: "decisionTitle and userQuestion are required." });
    }

    const prompt = `Decision Dilemma: "${decisionTitle}"
Current Tiebreaker Winner: "${currentAnalysis?.tiebreakerVerdict?.winnerOptionName || "Not set"}"
User's Burning "What If?" Scenario / Skeptical Question: "${userQuestion}"
${highThinking ? "NOTE: High Reasoning Thinking Mode is activated. Perform rigorous multi-step game-theory modeling." : ""}

Current Analysis Summary:
${JSON.stringify(currentAnalysis || {}).slice(0, 4000)}

Provide an energetic, punchy, and deeply detailed answer in plain, simple words that cuts through the noise.
Include:
1. Direct, honest answer explaining exactly what happens in simple terms.
2. Does this scenario flip or break the Tiebreaker verdict? (Give a crystal clear YES or NO with dramatic explanation).
3. The exact secret trick / shield to survive or profit from this situation.`;

    const raw = await generateWithRetryAndFallback({
      contents: prompt,
      preferredModel: highThinking ? "gemini-3.1-pro-preview" : "gemini-3.5-flash",
      highThinking: Boolean(highThinking),
      config: {
        systemInstruction: "You are a sharp, lively, plain-speaking decision sparring partner. Write in vivid, everyday language with high clarity and zero buzzwords.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directAnswer: { type: Type.STRING },
            verdictImpact: {
              type: Type.OBJECT,
              properties: {
                verdictChanges: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING },
                recommendedShift: { type: Type.STRING },
              },
              required: ["verdictChanges", "explanation", "recommendedShift"],
            },
            keyTakeaway: { type: Type.STRING },
          },
          required: ["directAnswer", "verdictImpact", "keyTakeaway"],
        },
      },
    });

    const result = safeParseJSON(raw);
    result.modelUsed = raw.modelUsed;
    result.highThinkingUsed = raw.highThinkingUsed;
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/challenge-decision:", error);
    res.status(500).json({ error: error.message || "Failed to challenge decision" });
  }
});

// Endpoint: Dedicated Scenario Explainer Generation
app.post("/api/explain-scenarios", async (req, res) => {
  try {
    const { decisionTitle, options, context = "", focusHorizon = "standard" } = req.body;
    if (!decisionTitle || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "decisionTitle and at least 2 options are required." });
    }

    const prompt = `You are a cinematic storyteller and realistic future forecaster.
For this decision, project the future in vivid, colorful, dramatic detail using SIMPLE, EVERYDAY WORDS that anyone can visualize instantly.

Decision: "${decisionTitle}"
Context: "${context}"
Focus Horizon Modifier: "${focusHorizon}"

Options to project:
${options.map((opt: any, idx: number) => `${idx + 1}. Option ID: "${opt.id}", Name: "${opt.name}", Details: "${opt.description || ""}"`).join("\n")}

For EACH option, build an unforgettable, richly detailed story:
1. Short-term (Months 1–6): The shock of change, the clumsy learning curve, the first huge victory, and the real emotional vibe.
2. Long-term (Years 2–5): Where you end up 5 years down the road — the superpower you unlock and the crazy domino effects.
3. Day in the Life: A detailed, movie-like timeline of an ordinary Tuesday (from waking up, morning coffee, key conversations, to going to bed).
4. Critical Fork in the Road: The big dramatic test that decides whether you win or fail.
5. Best-Case vs Worst-Case Trajectory: The dream fairy-tale outcome vs the worst nightmare meltdown.
6. A high-level comparative takeaway contrasting the divergent futures.`;

    const rawText = await generateWithRetryAndFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are a master storyteller and decision forecaster. Write in vivid, energetic, simple everyday English with rich sensory details.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decisionTitle: { type: Type.STRING },
            comparativeTakeaway: { type: Type.STRING },
            scenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  optionId: { type: Type.STRING },
                  optionName: { type: Type.STRING },
                  tagline: { type: Type.STRING },
                  shortTerm: {
                    type: Type.OBJECT,
                    properties: {
                      timeframe: { type: Type.STRING },
                      narrative: { type: Type.STRING },
                      keyMilestone: { type: Type.STRING },
                      frictionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                      emotionalState: { type: Type.STRING },
                    },
                    required: ["timeframe", "narrative", "keyMilestone", "frictionPoints", "emotionalState"],
                  },
                  longTerm: {
                    type: Type.OBJECT,
                    properties: {
                      timeframe: { type: Type.STRING },
                      narrative: { type: Type.STRING },
                      ultimateOutcome: { type: Type.STRING },
                      secondOrderEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                      compoundedAdvantage: { type: Type.STRING },
                    },
                    required: ["timeframe", "narrative", "ultimateOutcome", "secondOrderEffects", "compoundedAdvantage"],
                  },
                  dayInTheLife: { type: Type.STRING },
                  criticalForkInTheRoad: { type: Type.STRING },
                  bestCaseTrajectory: { type: Type.STRING },
                  worstCaseTrajectory: { type: Type.STRING },
                },
                required: [
                  "optionId",
                  "optionName",
                  "tagline",
                  "shortTerm",
                  "longTerm",
                  "dayInTheLife",
                  "criticalForkInTheRoad",
                  "bestCaseTrajectory",
                  "worstCaseTrajectory",
                ],
              },
            },
          },
          required: ["decisionTitle", "comparativeTakeaway", "scenarios"],
        },
      },
    });

    const result = safeParseJSON(rawText);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/explain-scenarios:", error);
    res.status(500).json({ error: error.message || "Failed to generate scenario narratives" });
  }
});

// Endpoint: Second Opinion & Cognitive Bias / Blind Spot Auditor
app.post("/api/second-opinion", async (req, res) => {
  try {
    const {
      decisionTitle,
      options,
      context = "",
      priorities = [],
      riskTolerance = "balanced",
      timeHorizon = "medium_term",
      currentAnalysis,
      highThinking = false,
    } = req.body;

    if (!decisionTitle || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "decisionTitle and at least 2 options are required." });
    }

    const winnerName = currentAnalysis?.tiebreakerVerdict?.winnerOptionName || "None";
    const prompt = `You are a fearless, delightfully candid truth-teller providing a SECOND OPINION on this big decision.
Your job is to call out human blind spots, sneaky mental traps, and false choices in SUPER EASY, VIVID, EXAGGERATED words that hit home instantly.

Decision: "${decisionTitle}"
Background Context: "${context || "No context provided"}"
Risk Tolerance: "${riskTolerance}"
Time Horizon: "${timeHorizon}"
User Stated Priorities: ${priorities.length > 0 ? priorities.join(", ") : "Not specified"}
Current Options:
${options.map((opt: any, idx: number) => `${idx + 1}. ${opt.name} (${opt.description || "No description"})`).join("\n")}
Current Winning Recommendation: "${winnerName}"
${highThinking ? "NOTE: High Reasoning Thinking Mode is activated. Perform rigorous multi-perspective bias audits." : ""}

Deliver an eye-opening, deeply detailed breakdown:
1. Overall Risk Level of Bias ("low" | "moderate" | "high" | "critical")
2. Executive Verdict: A bold, punchy 1-2 paragraph wake-up call in simple everyday English explaining if the user is trapped in a mental box or looking at things clearly.
3. 2 to 4 Specific Cognitive Biases Detected (e.g., "The Shiny Toy Trap", "The Golden Handcuffs Trap", "The Sunk-Cost Money Pit", "The Worst-Case Panic Attack") with simple everyday explanations and reframing prompts.
4. 2 to 4 Critical Blind Spots: Big obvious things the user is completely ignoring, plus the simple, shocking "Unasked Question".
5. 1 to 3 "The Third Path" / Secret Hybrid Options: Clever compromise choices that combine the best of both worlds.
6. 3 to 4 High-Stakes Pressure Test Questions: Piercing, emotional questions that reveal what the user actually wants deep down.
7. Recalibrated Final Advice: The ultimate, plain-English summary takeaway.`;

    const raw = await generateWithRetryAndFallback({
      contents: prompt,
      preferredModel: highThinking ? "gemini-3.1-pro-preview" : "gemini-3.5-flash",
      highThinking: Boolean(highThinking),
      config: {
        systemInstruction: "You are a fearless, crystal-clear decision auditor. Use simple words, dramatic metaphors, vivid everyday analogies, and deep practical detail.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskLevel: {
              type: Type.STRING,
              description: "low | moderate | high | critical",
            },
            executiveVerdict: {
              type: Type.STRING,
              description: "Sharp, dramatic, simple-word wake-up call on the decision traps.",
            },
            identifiedBiases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "high | medium | low" },
                  explanation: { type: Type.STRING },
                  mitigationPrompt: { type: Type.STRING },
                },
                required: ["name", "severity", "explanation", "mitigationPrompt"],
              },
            },
            blindSpots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  description: { type: Type.STRING },
                  unaskedQuestion: { type: Type.STRING },
                },
                required: ["area", "description", "unaskedQuestion"],
              },
            },
            alternativePaths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  advantage: { type: Type.STRING },
                },
                required: ["title", "description", "advantage"],
              },
            },
            pressureTestQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recalibratedAdvice: {
              type: Type.STRING,
            },
          },
          required: [
            "overallRiskLevel",
            "executiveVerdict",
            "identifiedBiases",
            "blindSpots",
            "alternativePaths",
            "pressureTestQuestions",
            "recalibratedAdvice",
          ],
        },
      },
    });

    const result = safeParseJSON(raw);
    result.modelUsed = raw.modelUsed;
    result.highThinkingUsed = raw.highThinkingUsed;
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/second-opinion:", error);
    res.status(500).json({ error: error.message || "Failed to audit decision for biases and blind spots" });
  }
});

// Endpoint: Multi-turn Gemini Chatbot with specific personas and model selection
app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages = [],
      persona = "tiebreaker",
      model = "gemini-3.5-flash",
      decisionContext,
      enableSearchGrounding = false,
      highThinking = false,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array cannot be empty." });
    }

    // Role system instructions
    const PERSONA_SYSTEM_INSTRUCTIONS: Record<string, string> = {
      tiebreaker: `You are 'The Tiebreaker' — an elite, witty, high-energy decision coach. You cut through overthinking, analysis paralysis, and confusion with vivid everyday examples, clear pros/cons tradeoffs, and direct recommendations in plain English. Your goal is to guide the user to make high-confidence, regret-free choices.`,
      devils_advocate: `You are 'The Devil's Advocate' — a razor-sharp, skeptical risk auditor and critical thinking sparring partner. You fearlessly poke holes in optimistic assumptions, uncover worst-case traps, challenge cognitive biases (like sunk cost or wishful thinking), and stress-test every option to build true resilience.`,
      empathetic_mentor: `You are the 'Life & Career Mentor' — an emotionally attuned, deeply supportive advisor. You prioritize personal well-being, authentic alignment, emotional peace of mind, family relationships, burnout prevention, and long-term fulfillment.`,
      financial_roi: `You are the 'Financial & ROI Strategist' — a pragmatic, numbers-smart economic thinker. You analyze opportunity costs, financial runways, negotiation leverage, risk-to-reward ratios, and downside protection in simple, practical terms.`,
      creative_wildcard: `You are the 'Creative Wildcard' — an innovative out-of-the-box thinker. You specialize in breaking false binary choices by inventing hybrid paths, staged trial periods, low-cost pilot experiments, and win-win alternatives that people often overlook.`,
    };

    let systemInstruction = PERSONA_SYSTEM_INSTRUCTIONS[persona] || PERSONA_SYSTEM_INSTRUCTIONS.tiebreaker;

    systemInstruction += `\n\nCommunication rules:
- Write in energetic, crystal-clear, plain everyday English with zero corporate buzzwords.
- Use colorful analogies and concrete real-world details.
- Format responses cleanly with Markdown (bold headings, punchy bullet points, and numbered action steps).
- Always give clear takeaways and ask probing follow-up questions to help the user advance.`;

    if (decisionContext && decisionContext.title) {
      systemInstruction += `\n\nACTIVE USER DECISION CONTEXT (Grounded Decision Data):
- Decision Title: "${decisionContext.title}"
- Background & Constraints: "${decisionContext.context || "None provided"}"
- Stated Priorities: "${Array.isArray(decisionContext.priorities) ? decisionContext.priorities.join(", ") : "Balanced"}"
- Options on the Table: ${Array.isArray(decisionContext.options) ? decisionContext.options.map((o: any) => `\n  * ${o.name}: ${o.description || ""}`).join("") : "None specified"}
- Current Leading Verdict: "${decisionContext.winningOption || "Not decided yet"}"
- Key Verdict Rationale: "${decisionContext.verdictSummary || ""}"`;
    }

    // Determine target model based on user selection / complexity guidelines:
    // - High thinking: gemini-3.1-pro-preview
    // - Search grounding: gemini-3.5-flash
    // - Fast tasks: gemini-3.1-flash-lite
    // - General tasks: gemini-3.5-flash
    let preferredModel = "gemini-3.5-flash";
    if (highThinking) {
      preferredModel = "gemini-3.1-pro-preview";
    } else if (model === "gemini-3.1-pro-preview" || model === "gemini-3.1-flash-lite" || model === "gemini-3.5-flash") {
      preferredModel = model;
    }

    // Format conversation history for @google/genai SDK
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));

    const rawResponse = await generateWithRetryAndFallback({
      contents: formattedContents,
      preferredModel,
      enableSearchGrounding: Boolean(enableSearchGrounding),
      highThinking: Boolean(highThinking),
      config: {
        systemInstruction,
      },
    });

    res.json({
      role: "model",
      content: rawResponse.text,
      persona,
      modelUsed: rawResponse.modelUsed,
      groundingSources: rawResponse.groundingSources,
      searchQueries: rawResponse.searchQueries,
      highThinkingUsed: rawResponse.highThinkingUsed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to generate chatbot response." });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Tiebreaker server running on http://localhost:${PORT}`);
  });
}

startServer();
