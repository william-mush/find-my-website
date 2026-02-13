/**
 * SEO and Traffic Analysis
 * Analyzes domain authority, backlinks, and traffic estimates
 */

import { domainClassifier } from '../intelligence/domain-classifier';
import type { WhoisData } from './whois';
import type { WaybackRecoveryInfo } from './wayback';

export interface SEOAnalysis {
  domain: string;

  domainAuthority: {
    score: number; // 0-100 (estimated)
    calculation: string;
  };

  backlinks: {
    estimatedTotal: number;
    fromWayback: number;
    quality: 'LOW' | 'MEDIUM' | 'HIGH';
  };

  content: {
    totalPages: number;
    indexedPages: number;
    archivedPages: number;
    contentAge: {
      oldest?: Date;
      newest?: Date;
      averageAge?: number;
    };
  };

  traffic: {
    estimatedMonthlyVisits?: number;
    trafficTrend: 'GROWING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';
    peakPeriod?: string;
  };

  keywords: {
    estimatedRanking: number;
    topKeywords: string[];
    visibility: number; // 0-100
  };

  social: {
    mentions: number;
    platforms: string[];
  };

  history: {
    ageInYears: number;
    peakPopularity?: Date;
    significantEvents: string[];
  };

  seoHealth: {
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };

  timestamp: Date;
}

export class SEOAPI {
  /**
   * Perform comprehensive SEO analysis
   */
  async analyze(
    domain: string,
    waybackData?: WaybackRecoveryInfo,
    whoisData?: WhoisData
  ): Promise<SEOAnalysis> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const archivedPages = waybackData?.totalSnapshots || 0;
    const domainAge = this.calculateDomainAge(whoisData);

    // Get intelligent classification
    const classification = domainClassifier.classify(cleanDomain, domainAge);

    // Use smarter scoring for major brands
    const domainAuthority = classification.isMajorBrand
      ? { score: 100, calculation: 'Major global brand - maximum authority' }
      : this.calculateDomainAuthority(domainAge, archivedPages);

    const contentAnalysis = this.analyzeContent(waybackData);
    const backlinks = classification.isMajorBrand
      ? { estimatedTotal: 10000000, fromWayback: archivedPages, quality: 'HIGH' as const }
      : this.estimateBacklinks(archivedPages, domainAge);
    const seoHealth = classification.isMajorBrand
      ? { score: 100, issues: [], recommendations: ['Domain has maximum SEO authority'] }
      : this.calculateSEOHealth(domainAge, archivedPages);

    return {
      domain: cleanDomain,
      domainAuthority,
      backlinks,
      content: {
        totalPages: archivedPages,
        indexedPages: 0, // Would require Google Search API
        archivedPages,
        contentAge: contentAnalysis.contentAge,
      },
      traffic: {
        estimatedMonthlyVisits: this.estimateTraffic(domainAuthority.score, archivedPages),
        trafficTrend: this.estimateTrafficTrend(waybackData),
        peakPeriod: contentAnalysis.peakPeriod,
      },
      keywords: {
        estimatedRanking: 0,
        topKeywords: [],
        visibility: Math.min(100, domainAuthority.score),
      },
      social: {
        mentions: 0,
        platforms: [],
      },
      history: {
        ageInYears: domainAge,
        peakPopularity: contentAnalysis.peakDate,
        significantEvents: contentAnalysis.significantEvents,
      },
      seoHealth,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate estimated domain authority
   */
  private calculateDomainAuthority(
    domainAgeYears: number,
    archivedPages: number
  ): SEOAnalysis['domainAuthority'] {
    let score = 0;
    const factors: string[] = [];

    // Age factor (max 30 points)
    const ageFactor = Math.min(30, domainAgeYears * 3);
    score += ageFactor;
    if (ageFactor > 0) {
      factors.push(`Domain age: ${domainAgeYears} years (+${Math.round(ageFactor)} points)`);
    }

    // Content volume factor (max 30 points)
    const contentFactor = Math.min(30, Math.log10(archivedPages + 1) * 10);
    score += contentFactor;
    if (contentFactor > 0) {
      factors.push(`Archived content: ${archivedPages} pages (+${Math.round(contentFactor)} points)`);
    }

    // Historical presence (max 20 points)
    if (archivedPages > 100) {
      score += 10;
      factors.push('Substantial historical presence (+10 points)');
    }
    if (archivedPages > 1000) {
      score += 10;
      factors.push('Large historical archive (+10 points)');
    }

    // Consistency factor (max 20 points)
    if (domainAgeYears > 5 && archivedPages > 50) {
      score += 20;
      factors.push('Long-term consistent presence (+20 points)');
    }

    score = Math.min(100, Math.round(score));

    return {
      score,
      calculation: factors.join(', '),
    };
  }

  /**
   * Estimate backlinks from archive data
   */
  private estimateBacklinks(
    archivedPages: number,
    domainAge: number
  ): SEOAnalysis['backlinks'] {
    // Rough estimation: popular sites get ~10-50 backlinks per archived page
    const estimatedTotal = Math.floor(archivedPages * 15);

    let quality: 'LOW' | 'MEDIUM' | 'HIGH';
    if (domainAge > 10 && archivedPages > 1000) quality = 'HIGH';
    else if (domainAge > 5 && archivedPages > 100) quality = 'MEDIUM';
    else quality = 'LOW';

    return {
      estimatedTotal,
      fromWayback: archivedPages,
      quality,
    };
  }

  /**
   * Analyze content from Wayback data
   */
  private analyzeContent(waybackData?: WaybackRecoveryInfo): {
    contentAge: SEOAnalysis['content']['contentAge'];
    peakDate?: Date;
    peakPeriod?: string;
    significantEvents: string[];
  } {
    const events: string[] = [];

    if (!waybackData || !waybackData.snapshots) {
      return {
        contentAge: {},
        significantEvents: events,
      };
    }

    const snapshots = waybackData.snapshots!;
    const timestamps = snapshots.map((s) => s.date);
    const oldest = timestamps[0];
    const newest = timestamps[timestamps.length - 1];

    if (oldest) {
      const age = Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      events.push(`First archived ${age} years ago`);
    }

    // Find peak activity
    const yearCounts = new Map<number, number>();
    timestamps.forEach((date: Date) => {
      const year = date.getFullYear();
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    });

    let peakYear = 0;
    let maxCount = 0;
    yearCounts.forEach((count, year) => {
      if (count > maxCount) {
        maxCount = count;
        peakYear = year;
      }
    });

    if (peakYear > 0) {
      events.push(`Peak activity in ${peakYear} (${maxCount} snapshots)`);
    }

    return {
      contentAge: {
        oldest,
        newest,
        averageAge: oldest ? Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
      },
      peakDate: peakYear > 0 ? new Date(peakYear, 0, 1) : undefined,
      peakPeriod: peakYear > 0 ? `${peakYear}` : undefined,
      significantEvents: events,
    };
  }

  /**
   * Estimate monthly traffic based on DA and content
   */
  private estimateTraffic(domainAuthority: number, archivedPages: number): number {
    // Very rough estimation formula
    // DA 0-20: 0-1k visits
    // DA 20-40: 1k-10k visits
    // DA 40-60: 10k-100k visits
    // DA 60-80: 100k-1M visits
    // DA 80-100: 1M+ visits

    const baseTraffic = Math.pow(10, domainAuthority / 20);
    const contentMultiplier = Math.log10(archivedPages + 1) / 3;

    return Math.floor(baseTraffic * contentMultiplier * 100);
  }

  /**
   * Estimate traffic trend from Wayback data
   */
  private estimateTrafficTrend(waybackData?: WaybackRecoveryInfo): SEOAnalysis['traffic']['trafficTrend'] {
    if (!waybackData || !waybackData.snapshots || waybackData.snapshots.length < 10) {
      return 'UNKNOWN';
    }

    const snapshots = waybackData.snapshots;
    const recentSnapshots = snapshots.slice(-20);
    const olderSnapshots = snapshots.slice(0, 20);

    if (recentSnapshots.length > olderSnapshots.length * 1.5) {
      return 'GROWING';
    } else if (recentSnapshots.length < olderSnapshots.length * 0.5) {
      return 'DECLINING';
    }

    return 'STABLE';
  }

  /**
   * Calculate overall SEO health score
   */
  private calculateSEOHealth(
    domainAge: number,
    archivedPages: number
  ): SEOAnalysis['seoHealth'] {
    let score = 50;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Domain age
    if (domainAge > 2) {
      score += 15;
    } else {
      issues.push('Domain is relatively new');
      recommendations.push('Continue building content and authority over time');
    }

    // Content volume
    if (archivedPages > 100) {
      score += 20;
    } else if (archivedPages < 10) {
      issues.push('Limited historical content');
      recommendations.push('Increase content production and consistency');
    }

    // Historical presence
    if (domainAge > 5 && archivedPages > 50) {
      score += 15;
    } else {
      issues.push('Limited historical web presence');
      recommendations.push('Maintain consistent online presence');
    }

    score = Math.min(100, Math.max(0, score));

    return {
      score,
      issues,
      recommendations,
    };
  }

  /**
   * Calculate domain age in years
   */
  private calculateDomainAge(whoisData?: WhoisData): number {
    if (!whoisData?.createdDate) return 0;

    const created = new Date(whoisData.createdDate);
    if (isNaN(created.getTime())) return 0;

    const ageMs = Date.now() - created.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25) * 10) / 10;
  }
}

// Export singleton instance
export const seoAPI = new SEOAPI();
