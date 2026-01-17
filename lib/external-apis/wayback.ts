/**
 * Wayback Machine API Integration
 * Fetches snapshots and historical data from archive.org
 */

import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout';

export interface WaybackSnapshot {
  url: string;
  timestamp: string;
  digest: string;
  mimetype: string;
  statuscode: string;
  length: string;
  waybackUrl: string;
  date: Date;
}

export interface WaybackAvailability {
  available: boolean;
  url?: string;
  timestamp?: string;
  closest?: {
    url: string;
    timestamp: string;
    status: string;
  };
}

export interface WaybackSummary {
  domain: string;
  totalSnapshots: number;
  firstSnapshot?: Date;
  lastSnapshot?: Date;
  snapshots: WaybackSnapshot[];
  years: Map<number, number>; // year -> count
}

export class WaybackMachineAPI {
  private baseUrl: string;
  private cdxUrl: string;

  constructor() {
    this.baseUrl = process.env.WAYBACK_API_URL || 'https://web.archive.org';
    this.cdxUrl = `${this.baseUrl}/cdx/search/cdx`;
  }

  /**
   * Check if a URL is available in the Wayback Machine
   */
  async checkAvailability(url: string): Promise<WaybackAvailability> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/wayback/available?url=${encodeURIComponent(url)}`,
        {},
        3000 // 3s timeout
      );

      if (!response.ok) {
        return { available: false };
      }

      const data = await response.json();

      if (!data.archived_snapshots?.closest) {
        return { available: false };
      }

      const closest = data.archived_snapshots.closest;
      return {
        available: closest.available,
        url: closest.url,
        timestamp: closest.timestamp,
        closest: {
          url: closest.url,
          timestamp: closest.timestamp,
          status: closest.status,
        },
      };
    } catch (error) {
      console.error('Wayback availability check failed:', error);
      return { available: false };
    }
  }

  /**
   * Get all snapshots for a domain
   */
  async getSnapshots(
    domain: string,
    options: {
      limit?: number;
      from?: string; // YYYYMMDD
      to?: string; // YYYYMMDD
      matchType?: 'exact' | 'prefix' | 'host' | 'domain';
      filter?: string;
    } = {}
  ): Promise<WaybackSnapshot[]> {
    try {
      const {
        limit = 1000,
        from,
        to,
        matchType = 'domain',
        filter = 'statuscode:200',
      } = options;

      const params = new URLSearchParams({
        url: domain,
        output: 'json',
        limit: limit.toString(),
        matchType,
        filter,
      });

      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await fetchWithTimeout(
        `${this.cdxUrl}?${params.toString()}`,
        {},
        3000 // 3s timeout for CDX API
      );

      if (!response.ok) {
        throw new Error(`Wayback API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length < 2) {
        return [];
      }

      // First row is headers
      const headers = data[0];
      const rows = data.slice(1);

      return rows.map((row: string[]) => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index];
        });

        return {
          url: obj.original || obj.url,
          timestamp: obj.timestamp,
          digest: obj.digest,
          mimetype: obj.mimetype,
          statuscode: obj.statuscode,
          length: obj.length,
          waybackUrl: `${this.baseUrl}/web/${obj.timestamp}/${obj.original || obj.url}`,
          date: this.parseTimestamp(obj.timestamp),
        };
      });
    } catch (error) {
      console.error('Failed to fetch Wayback snapshots:', error);
      return [];
    }
  }

  /**
   * Get a summary of snapshots for a domain
   */
  async getSnapshotSummary(domain: string): Promise<WaybackSummary> {
    const snapshots = await this.getSnapshots(domain, { limit: 10000 });

    const years = new Map<number, number>();
    let firstSnapshot: Date | undefined;
    let lastSnapshot: Date | undefined;

    snapshots.forEach((snapshot) => {
      const year = snapshot.date.getFullYear();
      years.set(year, (years.get(year) || 0) + 1);

      if (!firstSnapshot || snapshot.date < firstSnapshot) {
        firstSnapshot = snapshot.date;
      }
      if (!lastSnapshot || snapshot.date > lastSnapshot) {
        lastSnapshot = snapshot.date;
      }
    });

    return {
      domain,
      totalSnapshots: snapshots.length,
      firstSnapshot,
      lastSnapshot,
      snapshots: this.selectKeySnapshots(snapshots),
      years,
    };
  }

  /**
   * Get the best snapshot for recovery (most complete, recent)
   */
  async getBestSnapshot(domain: string): Promise<WaybackSnapshot | null> {
    const snapshots = await this.getSnapshots(domain, {
      limit: 100,
      filter: 'statuscode:200',
    });

    if (snapshots.length === 0) {
      return null;
    }

    // Sort by length (completeness) and recency
    const sorted = snapshots.sort((a, b) => {
      const lengthA = parseInt(a.length) || 0;
      const lengthB = parseInt(b.length) || 0;

      // Prefer larger snapshots
      if (lengthB !== lengthA) {
        return lengthB - lengthA;
      }

      // Then prefer more recent
      return b.date.getTime() - a.date.getTime();
    });

    return sorted[0];
  }

  /**
   * Get snapshots from different time periods (for timeline view)
   */
  async getTimelineSnapshots(domain: string, count: number = 10): Promise<WaybackSnapshot[]> {
    const allSnapshots = await this.getSnapshots(domain, { limit: 10000 });

    if (allSnapshots.length === 0) {
      return [];
    }

    return this.selectKeySnapshots(allSnapshots, count);
  }

  /**
   * Get recovery-specific snapshot info
   */
  async getRecoveryInfo(domain: string) {
    const [availability, summary, bestSnapshot] = await Promise.all([
      this.checkAvailability(domain),
      this.getSnapshotSummary(domain),
      this.getBestSnapshot(domain),
    ]);

    const hasContent = summary.totalSnapshots > 0;
    const isComplete = bestSnapshot && parseInt(bestSnapshot.length) > 10000;
    const isRecent = bestSnapshot &&
      (Date.now() - bestSnapshot.date.getTime()) < 365 * 24 * 60 * 60 * 1000; // < 1 year

    return {
      available: availability.available,
      hasContent,
      isComplete,
      isRecent,
      totalSnapshots: summary.totalSnapshots,
      firstSnapshot: summary.firstSnapshot,
      lastSnapshot: summary.lastSnapshot,
      bestSnapshot,
      yearlyBreakdown: Array.from(summary.years.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => b.year - a.year),
      estimatedPages: Math.min(summary.totalSnapshots, 500), // Rough estimate
      quality: this.assessQuality(summary, bestSnapshot),
    };
  }

  /**
   * Parse Wayback timestamp to Date
   */
  private parseTimestamp(timestamp: string): Date {
    // Format: YYYYMMDDhhmmss
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1;
    const day = parseInt(timestamp.substring(6, 8));
    const hour = parseInt(timestamp.substring(8, 10)) || 0;
    const minute = parseInt(timestamp.substring(10, 12)) || 0;
    const second = parseInt(timestamp.substring(12, 14)) || 0;

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Select key snapshots evenly distributed over time
   */
  private selectKeySnapshots(snapshots: WaybackSnapshot[], count: number = 10): WaybackSnapshot[] {
    if (snapshots.length <= count) {
      return snapshots;
    }

    const selected: WaybackSnapshot[] = [];
    const interval = Math.floor(snapshots.length / count);

    for (let i = 0; i < count; i++) {
      const index = i * interval;
      if (index < snapshots.length) {
        selected.push(snapshots[index]);
      }
    }

    // Always include the most recent
    if (selected[selected.length - 1] !== snapshots[snapshots.length - 1]) {
      selected.push(snapshots[snapshots.length - 1]);
    }

    return selected;
  }

  /**
   * Assess quality of archived content
   */
  private assessQuality(summary: WaybackSummary, bestSnapshot: WaybackSnapshot | null): string {
    if (!bestSnapshot || summary.totalSnapshots === 0) {
      return 'none';
    }

    const size = parseInt(bestSnapshot.length) || 0;
    const count = summary.totalSnapshots;

    if (size > 100000 && count > 50) {
      return 'excellent';
    } else if (size > 50000 && count > 20) {
      return 'good';
    } else if (size > 10000 && count > 5) {
      return 'fair';
    } else {
      return 'poor';
    }
  }
}

// Export singleton instance
export const waybackAPI = new WaybackMachineAPI();
