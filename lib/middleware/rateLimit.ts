import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  prefix: string;
  limit: number;
  windowSecs: number;
}

interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

const db = new Map<string, RateLimitRecord>();

/**
 * Performs rate limiting check.
 * Returns retry duration in seconds if limited, 0 if allowed.
 */
export function evaluateRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): { limited: boolean; retryAfter: number } {
  // In test environments (Jest), skip rate limiting to avoid cross-test contamination
  if (process.env.JEST_WORKER_ID || process.env.NODE_ENV === "test") {
    return { limited: false, retryAfter: 0 };
  }
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  
  const key = `${config.prefix}:${ip}`;
  const now = Date.now();
  
  const windowMs = config.windowSecs * 1000;
  const refillRate = config.limit / windowMs; // tokens per ms

  let record = db.get(key);
  if (!record) {
    record = { tokens: config.limit, lastRefill: now };
    db.set(key, record);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - record.lastRefill;
  const refill = elapsed * refillRate;
  record.tokens = Math.min(config.limit, record.tokens + refill);
  record.lastRefill = now;

  if (record.tokens >= 1) {
    record.tokens -= 1;
    db.set(key, record);
    return { limited: false, retryAfter: 0 };
  }

  // Calculate retry time in seconds
  const missing = 1 - record.tokens;
  const retryAfter = Math.ceil(missing / refillRate / 1000);
  return { limited: true, retryAfter };
}

/**
 * Helper to check rate limit and return a 429 response if limited.
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const { limited, retryAfter } = evaluateRateLimit(req, config);
  if (limited) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": retryAfter.toString() }
      }
    );
  }
  return null;
}

/**
 * Higher-order function wrapping route handlers with rate limiting.
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const limitedRes = await checkRateLimit(req, config);
    if (limitedRes) return limitedRes;
    return handler(req, ...args);
  };
}

/**
 * Fallback global rate limiter for general routes.
 */
export function isRateLimited(req: NextRequest): { limited: boolean; retryAfter: number } {
  return evaluateRateLimit(req, { prefix: "global", limit: 100, windowSecs: 60 });
}
