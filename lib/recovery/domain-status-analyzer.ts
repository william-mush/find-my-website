/**
 * Domain Status Analyzer
 * Determines the current state of a domain and recovery difficulty
 */

import { WhoisData } from '../external-apis/whois';
import { domainClassifier, DomainClassification } from '../intelligence/domain-classifier';

export type DomainStatus =
  | 'ACTIVE_IN_USE'
  | 'ACTIVE_PARKED'
  | 'ACTIVE_FOR_SALE'
  | 'ACTIVE_HOSTING_ISSUE'
  | 'EXPIRED_GRACE'
  | 'EXPIRED_REDEMPTION'
  | 'PENDING_DELETE'
  | 'AVAILABLE'
  | 'RESERVED'
  | 'UNKNOWN';

export type RecoveryDifficulty = 'EASY' | 'MODERATE' | 'HARD' | 'VERY_HARD' | 'IMPOSSIBLE';

export interface DomainStatusReport {
  domain: string;
  status: DomainStatus;
  isRegistered: boolean;
  isActive: boolean;
  isParked: boolean;
  isForSale: boolean;

  classification?: DomainClassification;

  recoveryDifficulty: RecoveryDifficulty;
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedTimeWeeks: number;
  successRate: number; // 0-100

  expiryDate?: Date;
  deletionDate?: Date;
  daysUntilExpiry?: number;
  daysSinceExpiry?: number;

  registrar?: string;
  registrarContact?: {
    email?: string;
    phone?: string;
  };

  reasons: string[]; // Explanation for the status
  warnings: string[]; // Important warnings
  opportunities: string[]; // Recovery opportunities
}

export class DomainStatusAnalyzer {
  /**
   * Analyze domain status and recovery potential
   */
  async analyze(
    domain: string,
    whoisData?: WhoisData,
    hasWaybackContent?: boolean,
    websiteActive?: boolean,
    dnsInfo?: { hasARecords: boolean; nameserversResolve: boolean }
  ): Promise<DomainStatusReport> {
    // Get intelligent classification
    const domainAge = whoisData?.createdDate
      ? (Date.now() - new Date(whoisData.createdDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      : undefined;

    const classification = domainClassifier.classify(domain, domainAge);

    const report: DomainStatusReport = {
      domain,
      status: 'UNKNOWN',
      isRegistered: false,
      isActive: false,
      isParked: false,
      isForSale: false,
      classification,
      recoveryDifficulty: 'MODERATE',
      estimatedCost: classification.estimatedValue,
      estimatedTimeWeeks: 0,
      successRate: 50,
      reasons: [],
      warnings: [],
      opportunities: [],
    };

    // Check if domain is registered
    // A domain is considered registered if it has:
    // 1. A registrar field, OR
    // 2. A createdDate (indicates registration), OR
    // 3. Registrant information
    const hasRegistrar = whoisData?.registrar && whoisData.registrar !== 'AVAILABLE';
    const hasCreatedDate = whoisData?.createdDate;
    const hasRegistrant = whoisData?.registrant?.name || whoisData?.registrant?.email;
    const isRegistered = hasRegistrar || hasCreatedDate || hasRegistrant;

    if (!whoisData || !isRegistered) {
      report.status = 'AVAILABLE';
      report.isRegistered = false;
      report.recoveryDifficulty = 'EASY';
      report.estimatedCost = { min: 10, max: 50, currency: 'USD' };
      report.estimatedTimeWeeks = 0;
      report.successRate = 100;
      report.reasons.push('Domain appears to be available for registration');
      report.opportunities.push('Register immediately at any domain registrar');
      return report;
    }

    report.isRegistered = true;
    if (whoisData.registrar) {
      report.registrar = whoisData.registrar;
    }

    if (whoisData.registrarAbuseEmail || whoisData.registrarAbusePhone) {
      report.registrarContact = {
        email: whoisData.registrarAbuseEmail,
        phone: whoisData.registrarAbusePhone,
      };
    }

    // Special handling for major brands
    if (classification.isMajorBrand) {
      report.status = 'ACTIVE_IN_USE';
      report.isActive = true;
      report.recoveryDifficulty = 'IMPOSSIBLE';
      report.successRate = 0;
      report.estimatedTimeWeeks = 0;
      report.reasons = [
        ...classification.reasons,
        'Domain is owned and actively used by the brand',
      ];
      report.warnings = [
        'This domain cannot be acquired through normal means',
        'Domain is protected by trademark law and extensive legal resources',
        'Any attempt to register similar domains may result in legal action',
      ];
      report.opportunities = [
        'This domain is not available for recovery',
        'Consider alternative domain names or variations',
        'Explore official partnership opportunities with the company',
      ];
      return report;
    }

    // Check expiry status
    if (whoisData.expiryDate) {
      report.expiryDate = whoisData.expiryDate;
      const now = new Date();
      const expiryTime = whoisData.expiryDate.getTime();
      const nowTime = now.getTime();
      const daysDiff = Math.floor((expiryTime - nowTime) / (1000 * 60 * 60 * 24));

      if (daysDiff > 0) {
        report.daysUntilExpiry = daysDiff;
        report.isActive = true;
      } else {
        report.daysSinceExpiry = Math.abs(daysDiff);
      }

      // Determine if in grace or redemption period
      if (report.daysSinceExpiry !== undefined && report.daysSinceExpiry > 0) {
        if (report.daysSinceExpiry <= 45) {
          // Grace period (0-45 days after expiry)
          report.status = 'EXPIRED_GRACE';
          report.recoveryDifficulty = 'MODERATE';
          report.estimatedCost = { min: 500, max: 2000, currency: 'USD' };
          report.estimatedTimeWeeks = 1;
          report.successRate = 70;
          report.reasons.push(`Domain expired ${report.daysSinceExpiry} days ago`);
          report.reasons.push('Currently in grace period');
          report.opportunities.push('Contact previous owner immediately');
          report.opportunities.push('Set up backorder service as backup');
          report.warnings.push('Grace period is time-sensitive - act quickly');
        } else if (report.daysSinceExpiry <= 75) {
          // Redemption period (45-75 days after expiry)
          report.status = 'EXPIRED_REDEMPTION';
          report.recoveryDifficulty = 'HARD';
          report.estimatedCost = { min: 1000, max: 5000, currency: 'USD' };
          report.estimatedTimeWeeks = 2;
          report.successRate = 50;
          report.deletionDate = new Date(
            whoisData.expiryDate.getTime() + 75 * 24 * 60 * 60 * 1000
          );
          report.reasons.push(`Domain expired ${report.daysSinceExpiry} days ago`);
          report.reasons.push('Currently in redemption period');
          report.opportunities.push('Contact previous owner (redemption fee required)');
          report.opportunities.push('Wait for deletion and use backorder service');
          report.warnings.push('Redemption fees are very expensive ($200-$1000+)');
        } else {
          // Pending deletion
          report.status = 'PENDING_DELETE';
          report.recoveryDifficulty = 'HARD';
          report.estimatedCost = { min: 69, max: 500, currency: 'USD' };
          report.estimatedTimeWeeks = 1;
          report.successRate = 30;
          report.deletionDate = new Date(
            whoisData.expiryDate.getTime() + 90 * 24 * 60 * 60 * 1000
          );
          report.reasons.push('Domain is pending deletion');
          report.reasons.push('Will be released to public soon');
          report.opportunities.push('Use domain backorder service (SnapNames, DropCatch, etc.)');
          report.opportunities.push('Use multiple backorder services to increase chances');
          report.warnings.push('High competition expected for popular domains');
          report.warnings.push('Success rate depends on domain popularity');
        }
      }
    }

    // Check for active hosting issue
    // Domain is registered, not expired, website is down, but DNS has A records
    // This indicates a hosting/server problem rather than a domain ownership issue
    if (
      report.status === 'UNKNOWN' &&
      report.isRegistered &&
      (report.daysUntilExpiry === undefined || report.daysUntilExpiry > 0) &&
      websiteActive === false &&
      dnsInfo?.hasARecords === true
    ) {
      report.status = 'ACTIVE_HOSTING_ISSUE';
      report.isActive = true;
      report.recoveryDifficulty = 'MODERATE';
      report.estimatedCost = { min: 0, max: 100, currency: 'USD' };
      report.estimatedTimeWeeks = 0;
      report.successRate = 90;
      report.reasons.push(
        'Domain is registered and DNS is configured, but the website is not responding'
      );
      report.opportunities.push(
        'Your domain registration is fine - this appears to be a hosting issue'
      );
      report.opportunities.push(
        'Check your web server or hosting provider for outages'
      );
      report.opportunities.push(
        'Verify your hosting account is active and properly configured'
      );
      return report;
    }

    // Active domain analysis
    // If website is online, the domain is active even without expiry date
    if (websiteActive === true && !report.isActive) {
      report.isActive = true;
    }

    if (report.status === 'UNKNOWN') {
      // If domain is registered and website is active, analyze the activity type
      if (report.isActive || websiteActive === true) {
        // Check if parked or in use
        // Domain is parked if website is offline AND there's no historical content
        if (websiteActive === false && !hasWaybackContent) {
          report.status = 'ACTIVE_PARKED';
          report.isParked = true;
          report.recoveryDifficulty = 'MODERATE';
          report.estimatedCost = { min: 1000, max: 10000, currency: 'USD' };
          report.estimatedTimeWeeks = 4;
          report.successRate = 60;
          report.reasons.push('Domain is registered but appears parked/inactive');
          report.opportunities.push('Contact owner with purchase offer');
          report.opportunities.push('Check if domain is listed for sale on aftermarket');
          report.opportunities.push('Contact registrar for owner information');
        } else if (this.isForSaleIndicator(whoisData)) {
          report.status = 'ACTIVE_FOR_SALE';
          report.isForSale = true;
          report.recoveryDifficulty = 'MODERATE';
          report.estimatedCost = { min: 500, max: 50000, currency: 'USD' };
          report.estimatedTimeWeeks = 2;
          report.successRate = 80;
          report.reasons.push('Domain appears to be for sale');
          report.opportunities.push('Contact owner directly via listing');
          report.opportunities.push('Negotiate price or use domain broker');
          report.warnings.push('Price may be negotiable, especially for older listings');
        } else {
          report.status = 'ACTIVE_IN_USE';
          report.isActive = true;
          report.recoveryDifficulty = 'VERY_HARD';
          report.estimatedCost = { min: 5000, max: 100000, currency: 'USD' };
          report.estimatedTimeWeeks = 12;
          report.successRate = 20;
          report.reasons.push('Domain is actively used');
          report.opportunities.push('Contact current owner with purchase offer');
          report.opportunities.push('Use domain broker for negotiation');
          report.opportunities.push('Consider legal options if trademark infringement');
          report.warnings.push('Owner may not be willing to sell');
          report.warnings.push('Price will likely be very high');
        }
      } else {
        // Domain is registered but we don't have enough info about its status
        // Default to ACTIVE_PARKED if registered
        report.status = 'ACTIVE_PARKED';
        report.isParked = true;
        report.recoveryDifficulty = 'MODERATE';
        report.estimatedCost = classification.estimatedValue;
        report.estimatedTimeWeeks = 4;
        report.successRate = 60;
        report.reasons.push('Domain is registered');
        report.opportunities.push('Contact owner with purchase offer');
        report.opportunities.push('Check WHOIS for owner contact information');
      }
    }

    // Check for reserved/premium domains
    if (this.isReservedDomain(domain)) {
      report.status = 'RESERVED';
      report.recoveryDifficulty = 'IMPOSSIBLE';
      report.estimatedCost = { min: 0, max: 0, currency: 'USD' };
      report.estimatedTimeWeeks = 0;
      report.successRate = 0;
      report.reasons.push('Domain is reserved by registry');
      report.warnings.push('Reserved domains cannot be registered by the public');
    }

    return report;
  }

  /**
   * Check if domain shows for-sale indicators
   */
  private isForSaleIndicator(whoisData: WhoisData): boolean {
    // Check common parking/for-sale indicators
    const nameservers = whoisData.nameservers || [];
    const parkingIndicators = [
      'sedoparking',
      'parkingcrew',
      'bodis',
      'afternic',
      'sedo',
      'above.com',
      'parklogic',
    ];

    return nameservers.some((ns) =>
      parkingIndicators.some((indicator) => ns.includes(indicator))
    );
  }

  /**
   * Check if domain is reserved by registry
   */
  private isReservedDomain(domain: string): boolean {
    const reserved = [
      'example.com',
      'example.net',
      'example.org',
      'localhost',
      'test.com',
      'invalid.com',
    ];

    return reserved.includes(domain.toLowerCase());
  }

  /**
   * Calculate overall recovery score (0-100)
   */
  calculateRecoveryScore(report: DomainStatusReport): number {
    let score = report.successRate;

    // Adjust based on difficulty
    const difficultyMultipliers: Record<RecoveryDifficulty, number> = {
      EASY: 1.0,
      MODERATE: 0.8,
      HARD: 0.6,
      VERY_HARD: 0.3,
      IMPOSSIBLE: 0,
    };

    score *= difficultyMultipliers[report.recoveryDifficulty];

    // Adjust based on time sensitivity
    if (report.daysSinceExpiry !== undefined) {
      if (report.daysSinceExpiry < 30) {
        score += 10; // Bonus for being in early grace period
      }
    }

    // Cap at 100
    return Math.min(100, Math.max(0, Math.round(score)));
  }
}

// Export singleton instance
export const domainStatusAnalyzer = new DomainStatusAnalyzer();
