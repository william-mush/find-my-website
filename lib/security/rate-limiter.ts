/**
 * Rate Limiter using Upstash Redis
 * Prevents API abuse with sliding window rate limiting
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export class RateLimiter {
  private redis: Redis | null;

  constructor() {
    this.redis = redis;
  }

  /**
   * Check if request is within rate limit
   * Uses sliding window algorithm
   */
  async checkLimit(
    identifier: string,
    limit: number = 10,
    windowSeconds: number = 60
  ): Promise<RateLimitResult> {
    // If Redis not available, fail open (allow request)
    if (!this.redis) {
      console.warn('Redis not configured, rate limiting disabled - allowing request');
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Date.now() + windowSeconds * 1000,
      };
    }

    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      // Remove old entries outside the window
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const count = await this.redis.zcard(key);

      if (count >= limit) {
        // Get oldest request timestamp to calculate retry-after
        const oldest = await this.redis.zrange(key, 0, 0, { withScores: true });
        const oldestTimestamp = (oldest.length > 0 ? oldest[1] : now) as number;
        const retryAfter = Math.ceil((oldestTimestamp + windowSeconds * 1000 - now) / 1000);

        return {
          success: false,
          limit,
          remaining: 0,
          reset: oldestTimestamp + windowSeconds * 1000,
          retryAfter: Math.max(1, retryAfter),
        };
      }

      // Add current request
      await this.redis.zadd(key, { score: now, member: `${now}:${Math.random()}` });

      // Set expiry on key
      await this.redis.expire(key, windowSeconds);

      return {
        success: true,
        limit,
        remaining: limit - count - 1,
        reset: now + windowSeconds * 1000,
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if Redis fails
      return {
        success: true,
        limit,
        remaining: limit,
        reset: now + windowSeconds * 1000,
      };
    }
  }

  /**
   * Block an IP address for a duration
   */
  async blockIP(ip: string, durationSeconds: number = 3600): Promise<void> {
    if (!this.redis) return;

    const key = `blocked:ip:${ip}`;
    await this.redis.set(key, '1', { ex: durationSeconds });
  }

  /**
   * Check if IP is blocked
   */
  async isBlocked(ip: string): Promise<boolean> {
    if (!this.redis) return false;

    const key = `blocked:ip:${ip}`;
    const blocked = await this.redis.get(key);
    return blocked === '1';
  }

  /**
   * Get rate limit info without incrementing
   */
  async getLimit(identifier: string, limit: number = 10, windowSeconds: number = 60): Promise<RateLimitResult> {
    if (!this.redis) {
      return {
        success: true,
        limit,
        remaining: limit,
        reset: Date.now() + windowSeconds * 1000,
      };
    }

    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    try {
      const count = await this.redis.zcount(key, windowStart, now);

      return {
        success: count < limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset: now + windowSeconds * 1000,
      };
    } catch (error) {
      console.error('Rate limit info failed:', error);
      return {
        success: true,
        limit,
        remaining: limit,
        reset: now + windowSeconds * 1000,
      };
    }
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Vercel provides IP in x-forwarded-for header
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
