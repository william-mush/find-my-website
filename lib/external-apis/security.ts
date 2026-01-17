/**
 * Security and Reputation Analysis
 * Checks domain safety, blacklists, and trust scores
 */

import { domainClassifier } from '../intelligence/domain-classifier';

export interface SecurityAnalysis {
  domain: string;

  reputation: {
    trustScore: number; // 0-100
    ageScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reasons: string[];
  };

  blacklists: {
    isBlacklisted: boolean;
    sources: string[];
    categories: string[];
  };

  domainAge: {
    ageInDays: number;
    ageInYears: number;
    registeredDate?: Date;
    isNewDomain: boolean; // < 6 months
    isMatureDomain: boolean; // > 2 years
  };

  ownership: {
    hasChangedOwners: boolean;
    lastOwnershipChange?: Date;
    ownershipStability: 'STABLE' | 'UNSTABLE' | 'UNKNOWN';
  };

  legal: {
    hasTrademarkIssues: boolean;
    hasLegalDisputes: boolean;
    notes: string[];
  };

  ssl: {
    hasCertificate: boolean;
    certificateIssuer?: string;
    validUntil?: Date;
    isExpired: boolean;
    daysUntilExpiry?: number;
  };

  malware: {
    detected: boolean;
    lastScan?: Date;
    sources: string[];
  };

  spam: {
    isSpamListed: boolean;
    spamScore: number; // 0-100
    sources: string[];
  };

  phishing: {
    isPhishingSite: boolean;
    sources: string[];
  };

  timestamp: Date;
}

export class SecurityAPI {
  /**
   * Perform comprehensive security analysis
   */
  async analyze(domain: string, whoisData?: any): Promise<SecurityAnalysis> {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const domainAge = this.calculateDomainAge(whoisData);

    // Get intelligent classification
    const classification = domainClassifier.classify(cleanDomain, domainAge.ageInYears);

    // Use smarter reputation scoring for major brands
    const reputation = classification.isMajorBrand
      ? {
          trustScore: 100,
          ageScore: 100,
          riskLevel: 'LOW' as const,
          reasons: ['Verified major global brand', 'Maximum trust and security rating'],
        }
      : this.calculateReputation(domainAge, whoisData);

    // In production, you'd integrate with:
    // - Google Safe Browsing API
    // - VirusTotal API
    // - PhishTank API
    // - SURBL/URIBL blacklists
    // - Spamhaus

    return {
      domain: cleanDomain,
      reputation,
      blacklists: {
        isBlacklisted: false,
        sources: [],
        categories: [],
      },
      domainAge,
      ownership: {
        hasChangedOwners: false,
        ownershipStability: 'UNKNOWN',
      },
      legal: {
        hasTrademarkIssues: false,
        hasLegalDisputes: false,
        notes: [],
      },
      ssl: await this.checkSSL(cleanDomain),
      malware: {
        detected: false,
        sources: [],
      },
      spam: {
        isSpamListed: false,
        spamScore: 0,
        sources: [],
      },
      phishing: {
        isPhishingSite: false,
        sources: [],
      },
      timestamp: new Date(),
    };
  }

  /**
   * Calculate domain age from WHOIS data
   */
  private calculateDomainAge(whoisData?: any): SecurityAnalysis['domainAge'] {
    const createdDate = whoisData?.createdDate ? new Date(whoisData.createdDate) : undefined;

    if (!createdDate || isNaN(createdDate.getTime())) {
      return {
        ageInDays: 0,
        ageInYears: 0,
        isNewDomain: false,
        isMatureDomain: false,
      };
    }

    const now = new Date();
    const ageInMs = now.getTime() - createdDate.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    const ageInYears = ageInDays / 365.25;

    return {
      ageInDays,
      ageInYears: Math.floor(ageInYears * 10) / 10,
      registeredDate: createdDate,
      isNewDomain: ageInDays < 180, // < 6 months
      isMatureDomain: ageInDays > 730, // > 2 years
    };
  }

  /**
   * Calculate trust score and reputation
   */
  private calculateReputation(
    domainAge: SecurityAnalysis['domainAge'],
    whoisData?: any
  ): SecurityAnalysis['reputation'] {
    let score = 50; // Start at neutral
    const reasons: string[] = [];

    // Age scoring
    if (domainAge.isMatureDomain) {
      score += 20;
      reasons.push(`Domain registered for ${domainAge.ageInYears} years`);
    } else if (domainAge.isNewDomain) {
      score -= 15;
      reasons.push('Recently registered domain');
    }

    // WHOIS privacy
    if (whoisData?.registrant?.name && whoisData.registrant.name !== 'REDACTED FOR PRIVACY') {
      score += 10;
      reasons.push('Public WHOIS information available');
    }

    // Domain lock status
    if (whoisData?.status?.some((s: string) => s.includes('clientTransferProhibited'))) {
      score += 10;
      reasons.push('Domain locked (good security practice)');
    }

    // DNSSEC
    if (whoisData?.dnssec === 'signed') {
      score += 10;
      reasons.push('DNSSEC enabled');
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    const ageScore = Math.min(100, Math.floor((domainAge.ageInDays / 1825) * 100)); // 5 years = 100

    let riskLevel: SecurityAnalysis['reputation']['riskLevel'];
    if (score >= 75) riskLevel = 'LOW';
    else if (score >= 50) riskLevel = 'MEDIUM';
    else if (score >= 25) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    return {
      trustScore: score,
      ageScore,
      riskLevel,
      reasons,
    };
  }

  /**
   * Check SSL certificate status
   */
  private async checkSSL(domain: string): Promise<SecurityAnalysis['ssl']> {
    try {
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
      });

      return {
        hasCertificate: true,
        isExpired: false,
      };
    } catch (error) {
      return {
        hasCertificate: false,
        isExpired: false,
      };
    }
  }

  /**
   * Check if domain is on Google Safe Browsing
   * Note: Requires API key in production
   */
  async checkSafeBrowsing(domain: string): Promise<{
    isSafe: boolean;
    threats: string[];
  }> {
    // Placeholder - integrate with Google Safe Browsing API
    // https://developers.google.com/safe-browsing/v4
    return {
      isSafe: true,
      threats: [],
    };
  }

  /**
   * Check VirusTotal for malware/phishing reports
   * Note: Requires API key in production
   */
  async checkVirusTotal(domain: string): Promise<{
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
  }> {
    // Placeholder - integrate with VirusTotal API v3
    // https://developers.virustotal.com/reference/domains
    return {
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
    };
  }

  /**
   * Generate security summary
   */
  getSecuritySummary(analysis: SecurityAnalysis): {
    isSecure: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!analysis.ssl.hasCertificate) {
      warnings.push('No SSL certificate detected');
      recommendations.push('Install an SSL certificate for HTTPS');
    }

    if (analysis.ssl.isExpired) {
      warnings.push('SSL certificate has expired');
      recommendations.push('Renew SSL certificate immediately');
    }

    if (analysis.domainAge.isNewDomain) {
      warnings.push('Domain is less than 6 months old');
      recommendations.push('Build trust over time with consistent content');
    }

    if (analysis.blacklists.isBlacklisted) {
      warnings.push(`Listed on ${analysis.blacklists.sources.length} blacklist(s)`);
      recommendations.push('Request removal from blacklists and investigate cause');
    }

    if (analysis.reputation.riskLevel === 'HIGH' || analysis.reputation.riskLevel === 'CRITICAL') {
      warnings.push('Low trust score detected');
      recommendations.push('Improve domain reputation through legitimate use');
    }

    return {
      isSecure: warnings.length === 0,
      warnings,
      recommendations,
    };
  }
}

// Export singleton instance
export const securityAPI = new SecurityAPI();
