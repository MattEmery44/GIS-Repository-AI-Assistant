import { generateTransitDatabase, SO_CAL_AGENCIES, getMetricSummary } from "../data/transitData";
import { censusProfiles } from "../data/censusData";

const transitDatabase = generateTransitDatabase();

// ----------------- Declarations identical to server.ts -----------------

export const queryTransitStatsDeclaration = {
  name: "queryTransitStats",
  description: "Query UPT (passenger trips), VRM (revenue miles), and VRH (revenue hours) for Southern California transit agencies.",
  parameters: {
    type: "OBJECT",
    properties: {
      agencyId: {
        type: "STRING",
        description: "The agency short identifier (e.g., 'la-metro', 'metrolink', 'santa-monica', 'omnitrans', 'riverside-transit', 'foothill-transit', 'long-beach-transit', 'octa', 'gold-coast-transit', 'imperial-valley-transit', 'norwalk-transit', 'culver-city-bus', 'montebello-bus-lines', 'gardena-gtrans', 'ladot', 'pasadena-transit', 'beach-cities-transit', 'san-diego-mts') or 'all' for the whole region."
      },
      year: {
        type: "INTEGER",
        description: "Year of the statistic (2010 to 2026 inclusive)."
      },
      month: {
        type: "INTEGER",
        description: "Month of the statistic (1 for January to 12 for December). 2026 data only goes up to 4 (April)."
      },
      metric: {
        type: "STRING",
        description: "The metric to fetch: 'upt' (ridership/unlinked passenger trips), 'vrm' (vehicle revenue miles), 'vrh' (vehicle revenue hours). If blank, all three are returned."
      }
    },
    required: []
  }
};

export const getAgencyListDeclaration = {
  name: "getAgencyList",
  description: "Get a list of all 18 Southern California transit agencies supported in this system, including their full names and IDs.",
  parameters: {
    type: "OBJECT",
    properties: {}
  }
};

export const getCensusDemographicsDeclaration = {
  name: "getCensusDemographics",
  description: "Query demographics and socioeconomic profiles (population, income, poverty rate, transit commute rate, vehicles per household, minority rate, and Transit Dependency Index (TDI)) for different geography levels (county, municipal cities, and LA city neighborhoods) in Los Angeles County.",
  parameters: {
    type: "OBJECT",
    properties: {
      geographyId: {
        type: "STRING",
        description: "The unique ID of the geography (e.g. 'la-county', 'la-city', 'long-beach', 'santa-monica', 'pasadena', 'glendale', 'torrance', 'compton', 'westlake', 'koreatown', 'boyle-heights', 'downtown-la', 'hollywood', 'venice', 'south-la', 'pacoima'). Leave empty to get a full summary table of all geographies."
      }
    }
  }
};

// ----------------- Tool Handlers identical to server.ts -----------------

function handleQueryTransitStats(args: any) {
  const agencyId = args.agencyId || "all";
  const year = args.year;
  const month = args.month;

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

  if (year && month && filtered.length > 0) {
    const label = `${year}-${month < 10 ? '0' + month : month}`;
    
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

  if (filtered.length > 15) {
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

export async function sendDirectGeminiMessage(messages: any[]): Promise<{ reply: string; systemNotice?: boolean }> {
  // Read VITE_GEMINI_API_KEY from environment variables
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    return {
      reply: "Hello! I am your Southern California Transit assistant. I notice that your VITE_GEMINI_API_KEY is not defined yet in your environment variables. Please check the Secrets panel or set the environment variable to enable live AI Chat details.",
      systemNotice: true
    };
  }

  const systemInstruction = `You are the Southern California Transit Database Assistant, an expert consultant trained on Federal Transit Administration (FTA) National Transit Database (NTD) records and Los Angeles County ACS Demographic and Socioeconomic datasets.
You provide precise, concise, and helpful answers regarding the transit statistics (UPT, VRM, VRH) of Southern California transit agencies, as well as demographic/equity profiles across county, city, and neighborhood geometries (using US Census Bureau ACS estimates).

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

  const tools = [
    {
      functionDeclarations: [
        queryTransitStatsDeclaration,
        getAgencyListDeclaration,
        getCensusDemographicsDeclaration
      ]
    }
  ];

  const contents = messages.map(msg => ({
    role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    tools
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Direct connection status: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const firstCandidate = data.candidates?.[0];
    const firstPart = firstCandidate?.content?.parts?.[0];

    const functionCallObj = firstPart?.functionCall;
    if (functionCallObj) {
      const callName = functionCallObj.name;
      const callArgs = functionCallObj.args;

      let functionResult;
      if (callName === "queryTransitStats") {
        functionResult = handleQueryTransitStats(callArgs);
      } else if (callName === "getAgencyList") {
        functionResult = handleGetAgencyList();
      } else if (callName === "getCensusDemographics") {
        functionResult = handleGetCensusDemographics(callArgs);
      }

      const followUpContents = [
        ...contents,
        {
          role: "model",
          parts: [
            {
              functionCall: functionCallObj,
              thought_signature: "skip_thought_signature_validator"
            } as any
          ]
        },
        {
          role: "user",
          parts: [{
            functionResponse: {
              name: callName,
              response: { result: functionResult }
            }
          }]
        }
      ];

      const followUpPayload = {
        contents: followUpContents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        tools
      };

      const followUpResponse = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(followUpPayload)
      });

      if (!followUpResponse.ok) {
        const errText = await followUpResponse.text();
        throw new Error(`Follow-up direct connection status: ${followUpResponse.status} - ${errText}`);
      }

      const followUpData = await followUpResponse.json();
      const finalPartText = followUpData.candidates?.[0]?.content?.parts?.[0]?.text;
      return {
        reply: finalPartText || "I couldn't generate a response based on the dataset."
      };
    }

    return {
      reply: firstPart?.text || "No response received from live Gemini API."
    };
  } catch (error: any) {
    console.error("Direct live connection error:", error);
    throw error;
  }
}
