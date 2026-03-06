/**
 * lib/utils/rate-limit.ts
 *
 * Lightweight in-memory rate limiter for Next.js API routes.
 *
 * NOTE: In a serverless/edge environment each instance has its own memory, so
 * this provides best-effort protection against single-instance burst abuse.
 * For production-grade limiting across all instances, replace the store with
 * Upstash Redis or a similar distributed cache.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Periodically prune expired entries to avoid memory leaks. */
function cleanup(): void {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window. Default: 30 */
  limit?: number;
  /** Window size in milliseconds. Default: 60_000 (1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check whether `identifier` (typically an IP address + route key) has
 * exceeded the rate limit.
 *
 * @example
 * const result = rateLimit(`${getClientIp(req)}:onboarding/chat`, { limit: 20, windowMs: 60_000 });
 * if (!result.success) return rateLimitResponse(result);
 */
export function rateLimit(
  identifier: string,
  { limit = 30, windowMs = 60_000 }: RateLimitOptions = {}
): RateLimitResult {
  // Run cleanup ~1% of invocations to bound Map size
  if (Math.random() < 0.01) cleanup();

  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extract the client IP address from a Next.js Request (or any object with
 * a `.headers.get()` method).
 */
export function getClientIp(req: {
  headers: { get(name: string): string | null };
}): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * Build a standard 429 Too Many Requests NextResponse with Retry-After header.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new Response(JSON.stringify({ error: 'Too many requests — please try again shortly.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSec),
      'X-RateLimit-Reset': String(result.resetAt),
    },
  });
}
