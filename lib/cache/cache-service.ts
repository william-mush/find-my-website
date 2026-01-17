/**
 * Redis Cache Service
 * Caches expensive API calls (WHOIS, DNS, Wayback Machine)
 * Reduces external API costs and improves response times
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

export interface CacheOptions {
  ttl?: number; // Time-to-live in seconds
  namespace?: string; // Cache key namespace
}

export class CacheService {
  private redis: Redis | null;
  private defaultTTL: number = 3600; // 1 hour default

  constructor() {
    this.redis = redis;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, namespace: string = 'default'): Promise<T | null> {
    if (!this.redis) {
      console.warn('Redis not available, cache disabled');
      return null;
    }

    try {
      const fullKey = this.buildKey(key, namespace);
      const value = await this.redis.get<T>(fullKey);

      if (value) {
        console.log(`[Cache HIT] ${fullKey}`);
      } else {
        console.log(`[Cache MISS] ${fullKey}`);
      }

      return value;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    namespace: string = 'default',
    ttl?: number
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const fullKey = this.buildKey(key, namespace);
      const cacheTTL = ttl || this.defaultTTL;

      await this.redis.set(fullKey, value, { ex: cacheTTL });
      console.log(`[Cache SET] ${fullKey} (TTL: ${cacheTTL}s)`);
    } catch (error) {
      console.error('Cache set failed:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, namespace: string = 'default'): Promise<void> {
    if (!this.redis) return;

    try {
      const fullKey = this.buildKey(key, namespace);
      await this.redis.del(fullKey);
      console.log(`[Cache DEL] ${fullKey}`);
    } catch (error) {
      console.error('Cache delete failed:', error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl, namespace = 'default' } = options;

    // Try to get from cache
    const cached = await this.get<T>(key, namespace);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute function
    console.log(`[Cache EXEC] Executing function for ${namespace}:${key}`);
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, namespace, ttl);

    return value;
  }

  /**
   * Invalidate cache by pattern (namespace)
   */
  async invalidateNamespace(namespace: string): Promise<void> {
    if (!this.redis) return;

    try {
      // Note: This requires SCAN which may not be available in all Redis setups
      // For Upstash, we'll need to track keys manually or use a different approach
      console.log(`[Cache INVALIDATE] Namespace: ${namespace}`);
      // TODO: Implement pattern-based deletion if needed
    } catch (error) {
      console.error('Cache invalidate failed:', error);
    }
  }

  /**
   * Build cache key with namespace
   */
  private buildKey(key: string, namespace: string): string {
    return `cache:${namespace}:${key}`;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    available: boolean;
    namespace: string;
  }> {
    return {
      available: this.redis !== null,
      namespace: 'cache',
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Cache TTL Constants (in seconds)
 */
export const CacheTTL = {
  WHOIS: 86400,      // 24 hours - WHOIS data rarely changes
  DNS: 3600,         // 1 hour - DNS can change more frequently
  WAYBACK: 604800,   // 7 days - Historical data doesn't change
  DOMAIN_STATUS: 3600, // 1 hour - Domain status can change
  SECURITY: 43200,   // 12 hours - Security data fairly static
  SEO: 43200,        // 12 hours - SEO metrics change slowly
} as const;

/**
 * Cache Namespaces
 */
export const CacheNamespace = {
  WHOIS: 'whois',
  DNS: 'dns',
  WAYBACK: 'wayback',
  SECURITY: 'security',
  SEO: 'seo',
  DOMAIN_STATUS: 'status',
  ANALYSIS: 'analysis',
} as const;
