import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";
import {
  generateTransitDatabase,
  SO_CAL_AGENCIES,
  getMetricSummary,
  getAvailableMonths,
  TransitRecord
} from "./src/data/transitData";
import { censusProfiles } from "./src/data/censusData";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Transit Database
const transitDatabase = generateTransitDatabase();
const availableMonths = getAvailableMonths(transitDatabase);

// Lazy-initialized Gemini Client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI Chatbot functionality will respond with a notification.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------- API Endpoints -----------------

// API: Get Southern California Transit Agencies Metadata
app.get("/api/transit/agencies", (req, res) => {
  res.json({
    status: "ok",
    agencies: SO_CAL_AGENCIES
  });
});

// API: Get complete transit records
app.get("/api/transit/records", (req, res) => {
  res.json({
    status: "ok",
    records: transitDatabase,
    availableMonths
  });
});

// API: Get summary for a specific agency, metric, and month
app.get("/api/transit/summary", (req, res) => {
  const { agencyId, monthLabel, metric } = req.query;
  if (!monthLabel || !metric) {
    res.status(400).json({ error: "Missing monthLabel or metric in query" });
    return;
  }

  const validMetrics = ["upt", "vrm", "vh"];
  const targetId = (agencyId as string) || "all";
  const targetMetric = (metric as string).toLowerCase() as "upt" | "vrm" | "vrh";

  try {
    const summary = getMetricSummary(transitDatabase, targetId, monthLabel as string, targetMetric);
    res.json({
      status: "ok",
      summary
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------- AI Chatbot Integration -----------------

// Define tools for Gemini to query transit statistics
const queryTransitStatsDeclaration: FunctionDeclaration = {
  name: "queryTransitStats",
  description: "Query UPT (passenger trips), VRM (revenue miles), and VRH (revenue hours) for Southern California transit agencies.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      agencyId: {
        type: Type.STRING,
        description: "The agency short identifier (e.g., 'la-metro', 'metrolink', 'santa-monica', 'omnitrans', 'riverside-transit', 'foothill-transit', 'long-beach-transit', 'octa', 'gold-coast-transit', 'imperial-valley-transit', 'norwalk-transit', 'culver-city-bus', 'montebello-bus-lines', 'gardena-gtrans', 'ladot', 'pasadena-transit', 'beach-cities-transit', 'san-diego-mts') or 'all' for the whole region."
      },
      year: {
        type: Type.INTEGER,
        description: "Year of the statistic (2010 to 2026 inclusive)."
      },
      month: {
        type: Type.INTEGER,
        description: "Month of the statistic (1 for January to 12 for December). 2026 data only goes up to 4 (April)."
      },
      metric: {
        type: Type.STRING,
        description: "The metric to fetch: 'upt' (ridership/unlinked passenger trips), 'vrm' (vehicle revenue miles), 'vrh' (vehicle revenue hours). If blank, all three are returned."
      }
    },
    required: []
  }
};

const getAgencyListDeclaration: FunctionDeclaration = {
  name: "getAgencyList",
  description: "Get a list of all 18 Southern California transit agencies supported in this system, including their full names and IDs.",
  parameters: {
    type: Type.OBJECT,
    properties: {}
  }
};

const getCensusDemographicsDeclaration: FunctionDeclaration = {
  name: "getCensusDemographics",
  description: "Query demographics and socioeconomic profiles (population, income, poverty rate, transit commute rate, vehicles per household, minority rate, and Transit Dependency Index (TDI)) for different geography levels (county, municipal cities, and LA city neighborhoods) in Los Angeles County.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      geographyId: {
        type: Type.STRING,
        description: "The unique ID of the geography (e.g. 'la-county', 'la-city', 'long-beach', 'santa-monica', 'pasadena', 'glendale', 'torrance', 'compton', 'westlake', 'koreatown', 'boyle-heights', 'downtown-la', 'hollywood', 'venice', 'south-la', 'pacoima'). Leave empty to get a full summary table of all geographies."
      }
    }
  }
};

// Executable functions for the local database
function handleQueryTransitStats(args: any) {
  const agencyId = args.agencyId || "all";
  const year = args.year;
  const month = args.month;
  const metric = args.metric ? args.metric.toLowerCase() : null;

  let filtered = transitDatabase;

  if (agencyId !== "all") {
    filtered = filtered.filter(r => r.agencyId === agencyId);
  }
  if (year) {
    filtered = filtered.filter(r => r.year === year);
  }
  if (month) {
    filtered = filtered.filter(r => r.month === month);
  }

  // If we are looking for a single month overview or comparison
  if (year && month && filtered.length > 0) {
    const label = `${year}-${month < 10 ? '0' + month : month}`;
    
    // Check if we want a specific metric summary
    const uptSummary = getMetricSummary(transitDatabase, agencyId, label, "upt");
    const vrmSummary = getMetricSummary(transitDatabase, agencyId, label, "vrm");
    const vrhSummary = getMetricSummary(transitDatabase, agencyId, label, "vrh");

    const agencyItem = agencyId === "all" ? { name: "All SoCal Agencies" } : SO_CAL_AGENCIES.find(a => a.id === agencyId);

    return {
      agency: agencyItem?.name || agencyId,
      period: label,
      metrics: {
        upt: {
          total: uptSummary.currentVal,
          momPercent: uptSummary.momPercent ? `${uptSummary.momPercent.toFixed(2)}%` : "N/A",
          yoyPercent: uptSummary.yoyPercent ? `${uptSummary.yoyPercent.toFixed(2)}%` : "N/A"
        },
        vrm: {
          total: vrmSummary.currentVal,
          momPercent: vrmSummary.momPercent ? `${vrmSummary.momPercent.toFixed(2)}%` : "N/A",
          yoyPercent: vrmSummary.yoyPercent ? `${vrmSummary.yoyPercent.toFixed(2)}%` : "N/A"
        },
        vrh: {
          total: vrhSummary.currentVal,
          momPercent: vrhSummary.momPercent ? `${vrmSummary.momPercent.toFixed(2)}%` : "N/A",
          yoyPercent: vrhSummary.yoyPercent ? `${vrmSummary.yoyPercent.toFixed(2)}%` : "N/A"
        }
      }
    };
  }

  // Otherwise, return a reasonable aggregate series or first few values to avoid text bloating
  if (filtered.length > 15) {
    // If asking for trend without specific month, return summarizing statistics
    const totals = filtered.reduce((acc, curr) => ({
      upt: acc.upt + curr.upt,
      vrm: acc.vrm + curr.vrm,
      vrh: acc.vrh + curr.vrh
    }), { upt: 0, vrm: 0, vrh: 0 });

    const agencyItem = agencyId === "all" ? { name: "All SoCal Agencies" } : SO_CAL_AGENCIES.find(a => a.id === agencyId);

    return {
      message: `Found ${filtered.length} monthly records. Showing aggregated totals for the matching criteria.`,
      agency: agencyItem?.name || agencyId,
      recordsCount: filtered.length,
      aggregateTotals: totals,
      averageMonthly: {
        upt: Math.round(totals.upt / filtered.length),
        vrm: Math.round(totals.vrm / filtered.length),
        vrh: Math.round(totals.vrh / filtered.length)
      }
    };
  }

  return filtered.map(r => ({
    agencyName: r.agencyName,
    period: r.monthLabel,
    upt: r.upt,
    vrm: r.vrm,
    vrh: r.vrh
  }));
}

function handleGetAgencyList() {
  return SO_CAL_AGENCIES.map(a => ({
    id: a.id,
    name: a.name,
    primaryMode: a.primaryMode,
    serviceArea: a.serviceArea
  }));
}

function calculateTDIServer(profile: any): number {
  const povertyWeight = profile.povertyRate * 1.25;
  const transitWeight = profile.transitCommuteRate * 1.15;
  const vehicleFactor = Math.max(0, 2.2 - profile.vehiclesPerHousehold) * 20;
  const rawVal = povertyWeight + transitWeight + vehicleFactor;
  return Math.min(100, Math.round(rawVal));
}

function handleGetCensusDemographics(args: any) {
  const geoId = args.geographyId;
  if (geoId) {
    const profile = censusProfiles.find(p => p.id === geoId);
    if (profile) {
      return {
        ...profile,
        transitDependencyIndex: calculateTDIServer(profile)
      };
    }
    return { error: `Census level geography with ID '${geoId}' was not found in LA County datasets.` };
  }
  return censusProfiles.map(p => ({
    id: p.id,
    name: p.name,
    level: p.level,
    parent: p.parent,
    population: p.population,
    medianIncome: p.medianIncome,
    povertyRate: p.povertyRate,
    transitCommuteRate: p.transitCommuteRate,
    vehiclesPerHousehold: p.vehiclesPerHousehold,
    minorityRate: p.minorityRate,
    medianAge: p.medianAge,
    transitDependencyIndex: calculateTDIServer(p),
    description: p.description
  }));
}

// POST endpoint for AI transit statistics consultant
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid messages array in request body" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful response when key is missing so preview works
    res.json({
      reply: "Hello! I am your Southern California Transit assistant. I notice that your `GEMINI_API_KEY` is not set yet in the Secrets panel. However, you can explore all transit statistics, trend analysis charts, MoM and YoY calculations, and export options using the interactive dashboard controls above! Let me know if you have any questions once the API key is connected.",
      systemNotice: true
    });
    return;
  }

  try {
    const ai = getGeminiClient();

    // Map conversation logs to what Gemini expects.
    // Ensure text fields are represented cleanly since Gemini-3.5-flash uses standard format.
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `You are the Southern California Transit Database Assistant, an expert consultant trained on Federal Transit Administration (FTA) National Transit Database (NTD) records and Los Angeles County ACS Demographic and Socioeconomic datasets.
You provide precise, concise, and helpful answers regarding the transit statistics (UPT, VRM, VRH) of Southern California transit agencies, as well as demographic/equity profiles across county, city, and neighborhood geographies (using US Census Bureau ACS estimates).

We support exactly 18 major Southern California agencies:
1. LA Metro (la-metro)
2. Metrolink (metrolink)
3. Santa Monica Big Blue Bus (santa-monica)
4. Omnitrans (omnitrans)
5. Riverside Transit (riverside-transit)
6. Foothill Transit (foothill-transit)
7. Long Beach Transit (long-beach-transit)
8. OCTA (octa)
9. Gold Coast Transit (gold-coast-transit)
10. Imperial Valley Transit (imperial-valley-transit)
11. Norwalk Transit (norwalk-transit)
12. Culver CityBus (culver-city-bus)
13. Montebello Bus Lines (montebello-bus-lines)
14. Gardena GTrans (gardena-gtrans)
15. LADOT (ladot)
16. Pasadena Transit (pasadena-transit)
17. Beach Cities Transit (beach-cities-transit)
18. San Diego MTS (san-diego-mts)

Our stats range monthly from January 2010 (2010-01) to April 2026 (2026-04).
You have access to three custom tools:
1. 'queryTransitStats': Search ridership, mileage, and service hour records.
2. 'getAgencyList': Review valid transit authorities metadata.
3. 'getCensusDemographics': Retrieve Los Angeles County socioeconomic and demographic profiles (for county, city, or neighborhood levels like Westlake, Koreatown, Boyle Heights, Torrance, Santa Monica, Pasadena, etc.) to examine equity, vehicle penetration, poverty rates, and Transit Dependency Index (TDI) scores.

Always execute 'queryTransitStats' if the user asks for numbers, and 'getCensusDemographics' when asked about LA county community structures, poverty, or transit-car density correlations. Do NOT fabricate numbers; if you are unsure, call the tool.
Summarize findings in a clean text or markdown table. Connect transit outcomes directly with neighborhood commuter profiles to explain transit dependency. Focus on helpful, precise, or equity-oriented transit insights.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [queryTransitStatsDeclaration, getAgencyListDeclaration, getCensusDemographicsDeclaration] }],
      }
    });

    // Check for function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      let functionResult;

      if (call.name === "queryTransitStats") {
        functionResult = handleQueryTransitStats(call.args);
      } else if (call.name === "getAgencyList") {
        functionResult = handleGetAgencyList();
      } else if (call.name === "getCensusDemographics") {
        functionResult = handleGetCensusDemographics(call.args);
      }

      // Append the tool results to continue generating the conversational block
      const updatedContents = [
        ...contents,
        {
          role: "model" as const,
          parts: [{ functionCall: call }]
        },
        {
          role: "user" as const, // For model callbacks in standard API, return it under user/tool role
          parts: [{
            functionResponse: {
              name: call.name,
              response: { result: functionResult }
            }
          }]
        }
      ];

      const followUpResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: updatedContents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [queryTransitStatsDeclaration, getAgencyListDeclaration, getCensusDemographicsDeclaration] }],
        }
      });

      res.json({
        reply: followUpResponse.text,
        debug: {
          toolCall: call.name,
          args: call.args,
          result: functionResult
        }
      });
    } else {
      res.json({
        reply: response.text
      });
    }

  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI assistant." });
  }
});

// ----------------- Vite / Static Files Setup -----------------

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in env ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
