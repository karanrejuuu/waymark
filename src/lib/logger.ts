/**
 * Production Logger, Rate Limiter, and Sentry Instrumentation Hook
 */

interface RateLimitStore {
  [key: string]: { count: number; expiresAt: number };
}

const memoryRateLimit: RateLimitStore = {};

export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta || "");
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta || "");
  },
  error: (msg: string, err?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || "");
    // If Sentry DSN is configured, capture exception
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(err || new Error(msg));
    }
  },
};

/**
 * In-memory token bucket rate limiter for API & Auth routes.
 * windowMs: time window in milliseconds
 * maxRequests: max requests allowed within window
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = memoryRateLimit[identifier];

  if (!record || now > record.expiresAt) {
    memoryRateLimit[identifier] = {
      count: 1,
      expiresAt: now + windowMs,
    };
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}
