/**
 * Analytics and Monitoring Utilities
 * Query usage data for insights and alerting
 */

import { db } from '@/lib/db';
import { apiUsage, ipAbuse } from '@/lib/db/schema';
import { sql, gte, and, desc } from 'drizzle-orm';

export interface AnalyticsMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  invalidInputRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  averageResponseTime: number;
  topDomains: Array<{ domain: string; count: number }>;
  topIPs: Array<{ ip: string; requests: number }>;
  hourlyBreakdown: Array<{ hour: string; requests: number }>;
}

export interface SecurityMetrics {
  totalViolations: number;
  blockedIPs: number;
  rateLimitViolations: number;
  invalidInputAttempts: number;
  suspiciousPatterns: number;
  topOffenders: Array<{ ip: string; violations: number; blockReason: string }>;
}

export class AnalyticsService {
  /**
   * Get analytics for a time period
   */
  async getMetrics(since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<AnalyticsMetrics> {
    // Total requests
    const totalQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(gte(apiUsage.requestedAt, since));

    // Successful (2xx) requests
    const successQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), sql`${apiUsage.statusCode} >= 200 AND ${apiUsage.statusCode} < 300`));

    // Failed (4xx/5xx) requests
    const failedQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), sql`${apiUsage.statusCode} >= 400`));

    // Rate limited
    const rateLimitedQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), sql`${apiUsage.wasRateLimited} = true`));

    // Invalid input
    const invalidInputQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), sql`${apiUsage.wasInvalidInput} = true`));

    // Blocked
    const blockedQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), sql`${apiUsage.wasBlocked} = true`));

    // Unique IPs
    const uniqueIPsQuery = await db
      .selectDistinct({ ip: apiUsage.ipAddress })
      .from(apiUsage)
      .where(gte(apiUsage.requestedAt, since));

    // Average response time
    const avgResponseQuery = await db
      .select({ avg: sql<number>`AVG(${apiUsage.responseTime})::int` })
      .from(apiUsage)
      .where(gte(apiUsage.requestedAt, since));

    // Top domains
    const topDomainsQuery = await db
      .select({
        domain: apiUsage.domain,
        count: sql<number>`count(*)::int`,
      })
      .from(apiUsage)
      .where(and(gte(apiUsage.requestedAt, since), sql`${apiUsage.domain} IS NOT NULL`))
      .groupBy(apiUsage.domain)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Top IPs
    const topIPsQuery = await db
      .select({
        ip: apiUsage.ipAddress,
        requests: sql<number>`count(*)::int`,
      })
      .from(apiUsage)
      .where(gte(apiUsage.requestedAt, since))
      .groupBy(apiUsage.ipAddress)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Hourly breakdown
    const hourlyQuery = await db
      .select({
        hour: sql<string>`to_char(${apiUsage.requestedAt}, 'YYYY-MM-DD HH24:00')`,
        requests: sql<number>`count(*)::int`,
      })
      .from(apiUsage)
      .where(gte(apiUsage.requestedAt, since))
      .groupBy(sql`to_char(${apiUsage.requestedAt}, 'YYYY-MM-DD HH24:00')`)
      .orderBy(sql`to_char(${apiUsage.requestedAt}, 'YYYY-MM-DD HH24:00')`);

    return {
      totalRequests: totalQuery[0]?.count || 0,
      successfulRequests: successQuery[0]?.count || 0,
      failedRequests: failedQuery[0]?.count || 0,
      rateLimitedRequests: rateLimitedQuery[0]?.count || 0,
      invalidInputRequests: invalidInputQuery[0]?.count || 0,
      blockedRequests: blockedQuery[0]?.count || 0,
      uniqueIPs: uniqueIPsQuery.length,
      averageResponseTime: avgResponseQuery[0]?.avg || 0,
      topDomains: topDomainsQuery.map(d => ({ domain: d.domain || 'unknown', count: d.count })),
      topIPs: topIPsQuery.map(i => ({ ip: i.ip, requests: i.requests })),
      hourlyBreakdown: hourlyQuery.map(h => ({ hour: h.hour, requests: h.requests })),
    };
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    // Total violations
    const totalViolationsQuery = await db
      .select({
        total: sql<number>`SUM(${ipAbuse.rateLimitViolations} + ${ipAbuse.invalidInputAttempts} + ${ipAbuse.suspiciousPatterns})::int`,
      })
      .from(ipAbuse);

    // Blocked IPs count
    const blockedIPsQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ipAbuse)
      .where(sql`${ipAbuse.isBlocked} = true`);

    // Rate limit violations sum
    const rateLimitQuery = await db
      .select({ total: sql<number>`SUM(${ipAbuse.rateLimitViolations})::int` })
      .from(ipAbuse);

    // Invalid input sum
    const invalidInputQuery = await db
      .select({ total: sql<number>`SUM(${ipAbuse.invalidInputAttempts})::int` })
      .from(ipAbuse);

    // Suspicious patterns sum
    const suspiciousQuery = await db
      .select({ total: sql<number>`SUM(${ipAbuse.suspiciousPatterns})::int` })
      .from(ipAbuse);

    // Top offenders
    const topOffendersQuery = await db
      .select({
        ip: ipAbuse.ipAddress,
        violations: sql<number>`(${ipAbuse.rateLimitViolations} + ${ipAbuse.invalidInputAttempts} + ${ipAbuse.suspiciousPatterns})::int`,
        blockReason: ipAbuse.blockReason,
      })
      .from(ipAbuse)
      .orderBy(desc(sql`(${ipAbuse.rateLimitViolations} + ${ipAbuse.invalidInputAttempts} + ${ipAbuse.suspiciousPatterns})`))
      .limit(10);

    return {
      totalViolations: totalViolationsQuery[0]?.total || 0,
      blockedIPs: blockedIPsQuery[0]?.count || 0,
      rateLimitViolations: rateLimitQuery[0]?.total || 0,
      invalidInputAttempts: invalidInputQuery[0]?.total || 0,
      suspiciousPatterns: suspiciousQuery[0]?.total || 0,
      topOffenders: topOffendersQuery.map(o => ({
        ip: o.ip,
        violations: o.violations,
        blockReason: o.blockReason || 'Unknown',
      })),
    };
  }

  /**
   * Check for anomalies (simple threshold-based)
   */
  async checkAnomalies(): Promise<{
    hasAnomalies: boolean;
    alerts: string[];
  }> {
    const metrics = await this.getMetrics(new Date(Date.now() - 60 * 60 * 1000)); // Last hour
    const alerts: string[] = [];

    // Check for high error rate
    if (metrics.totalRequests > 0) {
      const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
      if (errorRate > 50) {
        alerts.push(`High error rate: ${errorRate.toFixed(1)}% (${metrics.failedRequests}/${metrics.totalRequests})`);
      }
    }

    // Check for high rate limiting
    if (metrics.rateLimitedRequests > 50) {
      alerts.push(`High rate limit violations: ${metrics.rateLimitedRequests} in last hour`);
    }

    // Check for high invalid input (potential attack)
    if (metrics.invalidInputRequests > 20) {
      alerts.push(`Potential attack detected: ${metrics.invalidInputRequests} invalid input attempts`);
    }

    // Check for slow response times
    if (metrics.averageResponseTime > 5000) {
      alerts.push(`Slow response times: ${metrics.averageResponseTime}ms average`);
    }

    return {
      hasAnomalies: alerts.length > 0,
      alerts,
    };
  }
}

export const analyticsService = new AnalyticsService();
