import { NextRequest, NextResponse } from "next/server";

const FALLBACK = [
  "Generate differentiated lesson plans automatically from curriculum objectives.",
  "Auto-grade objective assessments and flag essays for manual review.",
  "Produce parent-friendly weekly summaries using student performance data.",
  "Suggest individualized learning resources based on topic weaknesses.",
];

function extractTextFromResp(json: any): string {
  if (!json) return "";
  if (typeof json === "string") return json;
  if (Array.isArray(json?.candidates) && json.candidates[0]?.output) return json.candidates[0].output;
  if (Array.isArray(json?.candidates) && json.candidates[0]?.content) return json.candidates[0].content;
  if (json?.output) return json.output;
  if (json?.candidates && typeof json.candidates[0] === "string") return json.candidates[0];
  return JSON.stringify(json);
}

// Simple in-memory cache and rate limiter.
declare global {
  // eslint-disable-next-line no-var
  var __aiInsightsCache: Map<string, { data: string[]; expires: number }> | undefined;
  // eslint-disable-next-line no-var
  var __aiInsightsRate: Map<string, { count: number; windowStart: number }> | undefined;
}

const CACHE_TTL = Number(process.env.AI_INSIGHTS_CACHE_TTL_SECONDS || 300);
const RATE_LIMIT = Number(process.env.AI_INSIGHTS_RATE_LIMIT || 6);
const RATE_WINDOW = Number(process.env.AI_INSIGHTS_RATE_WINDOW_SECONDS || 60);

if (!global.__aiInsightsCache) global.__aiInsightsCache = new Map();
if (!global.__aiInsightsRate) global.__aiInsightsRate = new Map();

export const GET = async (req: NextRequest) => {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5";

  // identify client by forwarded IP header when available
  const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();

  // rate limiting
  try {
    const now = Date.now();
    const rate = global.__aiInsightsRate!;
    const entry = rate.get(ip);
    if (!entry || now - entry.windowStart > RATE_WINDOW * 1000) {
      rate.set(ip, { count: 1, windowStart: now });
    } else {
      if (entry.count >= RATE_LIMIT) {
        const retryAfter = Math.ceil((entry.windowStart + RATE_WINDOW * 1000 - now) / 1000);
        return NextResponse.json({ error: "rate_limited", retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
      }
      rate.set(ip, { ...entry, count: entry.count + 1 });
    }
  } catch (e) {
    console.warn("Rate limiter failed", e);
  }

  // cache key - model + prompt version
  const cacheKey = `insights:${model}:v1`;
  const cache = global.__aiInsightsCache!;
  const bust = req.nextUrl.searchParams.get('bust');
  const cached = cache.get(cacheKey);
  if (!bust && cached && cached.expires > Date.now()) {
    return NextResponse.json({ data: cached.data, cached: true });
  }

  if (!API_KEY) {
    return NextResponse.json({ data: FALLBACK, warning: "No GEMINI_API_KEY configured" });
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateText?key=${API_KEY}`;
  const prompt = `Provide 5 concise, actionable AI recommendations for K-12 schools. Return only the recommendations as a numbered or bulleted list, each on its own line.`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: { text: prompt },
        temperature: 0.2,
        maxOutputTokens: 300,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini request failed:", res.status, text);
      return NextResponse.json({ data: FALLBACK }, { status: 502 });
    }

    const json = await res.json();
    const raw = extractTextFromResp(json);

    const lines = raw
      .split(/\r?\n|\u2022|\-|\d+\./)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);

    const data = lines.length ? lines : FALLBACK;

    // store in cache
    try {
      cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL * 1000 });
    } catch (e) {
      console.warn("Cache set failed", e);
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error calling Gemini:", err);
    return NextResponse.json({ data: FALLBACK }, { status: 500 });
  }
};
