/**
 * Simple in-memory rate limiter for API routes.
 * Tracks request counts per key (IP) within a sliding window.
 * Resets automatically when the window expires.
 */

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check rate limit for a given key.
 * @returns { success: true } if allowed, { success: false, retryAfter } if blocked
 */
export function rateLimit(
  key: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

/**
 * Get client IP from request headers (works behind Vercel/Cloudflare).
 */
export function getRequestIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}
