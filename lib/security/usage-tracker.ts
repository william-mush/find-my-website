/**
 * Usage Tracking and Analytics
 * Tracks API usage for analytics and abuse detection
 */

import { db } from '@/lib/db';
import { apiUsage, ipAbuse, domainSearches } from '@/lib/db/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';

export interface UsageRecord {
  ipAddress: string;
  userId?: string;
  endpoint: string;
  domain?: string;
  method: string;
  userAgent?: string;
  referer?: string;
  statusCode: number;
  responseTime: number;
  rateLimitRemaining: number;
  wasBlocked?: boolean;
  wasRateLimited?: boolean;
  wasInvalidInput?: boolean;
}

export class UsageTracker {
  /**
   * Track an API request
   */
  async trackRequest(record: UsageRecord): Promise<void> {
    try {
      // Don't await - fire and forget for performance
      this.recordUsage(record);
      this.updateIPStats(record);

      // If domain search, also track in domain_searches
      if (record.domain && record.statusCode === 200) {
        this.trackDomainSearch(record);
      }
    } catch (error) {
      console.error('Failed to track usage:', error);
      // Don't throw - tracking failure shouldn't break the API
    }
  }

  /**
   * Record usage in api_usage table
   */
  private async recordUsage(record: UsageRecord): Promise<void> {
    await db.insert(apiUsage).values({
      ipAddress: record.ipAddress,
      userId: record.userId,
      endpoint: record.endpoint,
      domain: record.domain,
      method: record.method,
      userAgent: record.userAgent,
      referer: record.referer,
      statusCode: record.statusCode,
      responseTime: record.responseTime,
      rateLimitRemaining: record.rateLimitRemaining,
      wasBlocked: record.wasBlocked || false,
      wasRateLimited: record.wasRateLimited || false,
      wasInvalidInput: record.wasInvalidInput || false,
    });
  }

  /**
   * Update IP abuse statistics
   */
  private async updateIPStats(record: UsageRecord): Promise<void> {
    const now = new Date();

    // Check if IP exists
    const existing = await db
      .select()
      .from(ipAbuse)
      .where(eq(ipAbuse.ipAddress, record.ipAddress))
      .limit(1);

    if (existing.length === 0) {
      // Create new record
      await db.insert(ipAbuse).values({
        ipAddress: record.ipAddress,
        totalRequests: 1,
        rateLimitViolations: record.wasRateLimited ? 1 : 0,
        invalidInputAttempts: record.wasInvalidInput ? 1 : 0,
        suspiciousPatterns: 0,
        userAgent: record.userAgent,
        firstSeen: now,
        lastSeen: now,
        lastViolation: record.wasRateLimited || record.wasInvalidInput ? now : undefined,
      });
    } else {
      // Update existing record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = {
        totalRequests: sql`${ipAbuse.totalRequests} + 1`,
        lastSeen: now,
      };

      if (record.wasRateLimited) {
        updates.rateLimitViolations = sql`${ipAbuse.rateLimitViolations} + 1`;
        updates.lastViolation = now;
      }

      if (record.wasInvalidInput) {
        updates.invalidInputAttempts = sql`${ipAbuse.invalidInputAttempts} + 1`;
        updates.lastViolation = now;
      }

      await db
        .update(ipAbuse)
        .set(updates)
        .where(eq(ipAbuse.ipAddress, record.ipAddress));

      // Check if we should auto-block this IP
      await this.checkAutoBlock(record.ipAddress);
    }
  }

  /**
   * Track domain search in domain_searches table
   */
  private async trackDomainSearch(record: UsageRecord): Promise<void> {
    if (!record.domain) return;

    await db.insert(domainSearches).values({
      domain: record.domain,
      ipAddress: record.ipAddress,
      userId: null, // No auth yet
    });
  }

  /**
   * Check if IP should be auto-blocked
   */
  private async checkAutoBlock(ipAddress: string): Promise<void> {
    const stats = await db
      .select()
      .from(ipAbuse)
      .where(eq(ipAbuse.ipAddress, ipAddress))
      .limit(1);

    if (stats.length === 0) return;

    const ip = stats[0];

    // Auto-block criteria:
    // - 20+ rate limit violations
    // - 10+ invalid input attempts
    // - Already blocked once before (repeat offender)

    const shouldBlock =
      ip.rateLimitViolations >= 20 ||
      ip.invalidInputAttempts >= 10 ||
      ((ip.autoBlockCount || 0) > 0 && ip.rateLimitViolations >= 10);

    if (shouldBlock && !ip.isBlocked) {
      const blockDuration = this.getBlockDuration(ip.autoBlockCount || 0);
      const now = new Date();
      const blockedUntil = new Date(now.getTime() + blockDuration);

      await db
        .update(ipAbuse)
        .set({
          isBlocked: true,
          blockReason: this.getBlockReason(ip),
          blockedAt: now,
          blockedUntil,
          autoBlockCount: sql`${ipAbuse.autoBlockCount} + 1`,
        })
        .where(eq(ipAbuse.ipAddress, ipAddress));

      console.warn(`[Auto-Block] IP ${ipAddress} blocked until ${blockedUntil.toISOString()}`);
    }
  }

  /**
   * Get block duration in milliseconds (exponential backoff)
   */
  private getBlockDuration(blockCount: number): number {
    const baseHours = 1;
    const hours = baseHours * Math.pow(2, blockCount); // 1h, 2h, 4h, 8h, etc.
    return hours * 60 * 60 * 1000;
  }

  /**
   * Get block reason message
   */
  private getBlockReason(ip: typeof ipAbuse.$inferSelect): string {
    const reasons: string[] = [];

    if (ip.rateLimitViolations >= 20) {
      reasons.push(`${ip.rateLimitViolations} rate limit violations`);
    }

    if (ip.invalidInputAttempts >= 10) {
      reasons.push(`${ip.invalidInputAttempts} invalid input attempts`);
    }

    if (ip.suspiciousPatterns > 0) {
      reasons.push(`${ip.suspiciousPatterns} suspicious patterns`);
    }

    return `Auto-blocked: ${reasons.join(', ')}`;
  }

  /**
   * Get the number of successful requests for a user/IP on a specific endpoint today
   */
  async getDailyUsageCount(endpoint: string, userId?: string, ipAddress?: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
      // Count by userId if available, otherwise by IP
      const condition = userId
        ? and(
            eq(apiUsage.endpoint, endpoint),
            eq(apiUsage.userId, userId),
            eq(apiUsage.statusCode, 200),
            gte(apiUsage.requestedAt, startOfDay)
          )
        : and(
            eq(apiUsage.endpoint, endpoint),
            eq(apiUsage.ipAddress, ipAddress || ''),
            eq(apiUsage.statusCode, 200),
            gte(apiUsage.requestedAt, startOfDay)
          );

      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(apiUsage)
        .where(condition);

      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get daily usage count:', error);
      return 0;
    }
  }

  /**
   * Get usage statistics for an IP
   */
  async getIPStats(ipAddress: string): Promise<typeof ipAbuse.$inferSelect | null> {
    const results = await db
      .select()
      .from(ipAbuse)
      .where(eq(ipAbuse.ipAddress, ipAddress))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get usage analytics for a time period
   */
  async getUsageAnalytics(since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    // Total requests
    const totalRequests = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(gte(apiUsage.requestedAt, since));

    // Rate limited requests
    const rateLimited = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), eq(apiUsage.wasRateLimited, true)));

    // Invalid input requests
    const invalidInput = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), eq(apiUsage.wasInvalidInput, true)));

    // Blocked requests
    const blocked = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), eq(apiUsage.wasBlocked, true)));

    // Unique IPs
    const uniqueIPs = await db
      .selectDistinct({ ipAddress: apiUsage.ipAddress })
      .from(apiUsage)
      .where(gte(apiUsage.requestedAt, since));

    // Currently blocked IPs
    const blockedIPs = await db
      .select()
      .from(ipAbuse)
      .where(eq(ipAbuse.isBlocked, true));

    return {
      totalRequests: totalRequests[0]?.count || 0,
      rateLimitedRequests: rateLimited[0]?.count || 0,
      invalidInputRequests: invalidInput[0]?.count || 0,
      blockedRequests: blocked[0]?.count || 0,
      uniqueIPs: uniqueIPs.length,
      currentlyBlockedIPs: blockedIPs.length,
      since: since.toISOString(),
    };
  }

  /**
   * Manually unblock an IP
   */
  async unblockIP(ipAddress: string): Promise<void> {
    await db
      .update(ipAbuse)
      .set({
        isBlocked: false,
        blockedAt: null,
        blockedUntil: null,
      })
      .where(eq(ipAbuse.ipAddress, ipAddress));

    console.log(`[Manual Unblock] IP ${ipAddress} unblocked`);
  }

  /**
   * Clean up expired blocks (run periodically)
   */
  async cleanupExpiredBlocks(): Promise<number> {
    const now = new Date();

    const result = await db
      .update(ipAbuse)
      .set({
        isBlocked: false,
        blockedAt: null,
        blockedUntil: null,
      })
      .where(and(eq(ipAbuse.isBlocked, true), lte(ipAbuse.blockedUntil, now)))
      .returning();

    console.log(`[Cleanup] Unblocked ${result.length} expired IPs`);
    return result.length;
  }
}

export const usageTracker = new UsageTracker();
