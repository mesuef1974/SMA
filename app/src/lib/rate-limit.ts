/**
 * Rate Limiting Utility — S1-D
 *
 * Sliding-window rate limiter with two backends:
 *   1. Upstash Redis (when UPSTASH_REDIS_REST_URL is an https:// URL + token is set)
 *   2. In-memory Map fallback (works everywhere, including Railway)
 *
 * Limit: 10 requests per 60-second sliding window, keyed by client IP.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (ms) when the window resets
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_REQUESTS = 10;
const WINDOW_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// In-memory sliding-window fallback
// ---------------------------------------------------------------------------

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - WINDOW_MS;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

function inMemoryRateLimit(identifier: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    // Earliest timestamp in window determines when the oldest request expires
    const oldestInWindow = entry.timestamps[0]!;
    const reset = oldestInWindow + WINDOW_MS;
    return {
      success: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      reset,
    };
  }

  // Allow the request
  entry.timestamps.push(now);
  const remaining = MAX_REQUESTS - entry.timestamps.length;
  const reset = entry.timestamps[0]! + WINDOW_MS;

  return {
    success: true,
    limit: MAX_REQUESTS,
    remaining,
    reset,
  };
}

// ---------------------------------------------------------------------------
// Upstash rate limiter (created lazily, only when env vars are valid)
// ---------------------------------------------------------------------------

let upstashLimiter: Ratelimit | null = null;
let upstashChecked = false;

function getUpstashLimiter(): Ratelimit | null {
  if (upstashChecked) return upstashLimiter;
  upstashChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Only use Upstash if we have an HTTPS REST URL and a token
  if (url && url.startsWith('https://') && token) {
    try {
      const redis = new Redis({ url, token });
      upstashLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(MAX_REQUESTS, '1 m'),
        analytics: false,
        prefix: 'sma:ratelimit',
      });
    } catch {
      console.warn('[rate-limit] Failed to initialize Upstash — falling back to in-memory');
      upstashLimiter = null;
    }
  }

  return upstashLimiter;
}

// ---------------------------------------------------------------------------
// IP extraction helper
// ---------------------------------------------------------------------------

export function getClientIP(req: Request): string {
  const headers = new Headers(req.headers);

  // Standard proxy headers (Railway, Vercel, Cloudflare, etc.)
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (client) IP
    return forwarded.split(',')[0]!.trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  // Last resort fallback
  return '127.0.0.1';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check rate limit for the given request.
 *
 * Uses Upstash Redis when properly configured, otherwise falls back to an
 * in-memory sliding window that works on any platform (Railway, Vercel, etc.).
 */
export async function rateLimit(req: Request): Promise<RateLimitResult> {
  const ip = getClientIP(req);
  const identifier = `ip:${ip}`;

  const limiter = getUpstashLimiter();

  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.warn('[rate-limit] Upstash error, falling back to in-memory:', error);
      // Fall through to in-memory on transient Redis errors
    }
  }

  return inMemoryRateLimit(identifier);
}

// ---------------------------------------------------------------------------
// 429 Response helper
// ---------------------------------------------------------------------------

/**
 * Build a standard 429 Too Many Requests response with Arabic message.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      error: 'لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.',
      limit: result.limit,
      remaining: result.remaining,
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    },
  );
}
