import { describe, it, expect } from 'vitest';
import { securityAPI } from '@/lib/external-apis/security';
import type { SecurityAnalysis } from '@/lib/external-apis/security';

describe('SecurityAPI', () => {
  describe('getSecuritySummary', () => {
    it('returns no warnings for a secure domain', () => {
      const analysis: SecurityAnalysis = {
        domain: 'example.com',
        reputation: { trustScore: 80, ageScore: 90, riskLevel: 'LOW', reasons: [] },
        blacklists: { isBlacklisted: false, sources: [], categories: [] },
        domainAge: { ageInDays: 3650, ageInYears: 10, isMatureDomain: true, isNewDomain: false },
        ownership: { hasChangedOwners: false, ownershipStability: 'STABLE' },
        legal: { hasTrademarkIssues: false, hasLegalDisputes: false, notes: [] },
        ssl: { hasCertificate: true, isExpired: false },
        malware: { detected: false, sources: [] },
        spam: { isSpamListed: false, spamScore: 0, sources: [] },
        phishing: { isPhishingSite: false, sources: [] },
        timestamp: new Date(),
      };

      const summary = securityAPI.getSecuritySummary(analysis);
      expect(summary.isSecure).toBe(true);
      expect(summary.warnings).toHaveLength(0);
    });

    it('warns about missing SSL', () => {
      const analysis: SecurityAnalysis = {
        domain: 'example.com',
        reputation: { trustScore: 50, ageScore: 50, riskLevel: 'MEDIUM', reasons: [] },
        blacklists: { isBlacklisted: false, sources: [], categories: [] },
        domainAge: { ageInDays: 365, ageInYears: 1, isMatureDomain: false, isNewDomain: false },
        ownership: { hasChangedOwners: false, ownershipStability: 'UNKNOWN' },
        legal: { hasTrademarkIssues: false, hasLegalDisputes: false, notes: [] },
        ssl: { hasCertificate: false, isExpired: false },
        malware: { detected: false, sources: [] },
        spam: { isSpamListed: false, spamScore: 0, sources: [] },
        phishing: { isPhishingSite: false, sources: [] },
        timestamp: new Date(),
      };

      const summary = securityAPI.getSecuritySummary(analysis);
      expect(summary.isSecure).toBe(false);
      expect(summary.warnings).toContain('No SSL certificate detected');
      expect(summary.recommendations).toContain('Install an SSL certificate for HTTPS');
    });

    it('warns about expired SSL', () => {
      const analysis: SecurityAnalysis = {
        domain: 'example.com',
        reputation: { trustScore: 50, ageScore: 50, riskLevel: 'MEDIUM', reasons: [] },
        blacklists: { isBlacklisted: false, sources: [], categories: [] },
        domainAge: { ageInDays: 365, ageInYears: 1, isMatureDomain: false, isNewDomain: false },
        ownership: { hasChangedOwners: false, ownershipStability: 'UNKNOWN' },
        legal: { hasTrademarkIssues: false, hasLegalDisputes: false, notes: [] },
        ssl: { hasCertificate: true, isExpired: true },
        malware: { detected: false, sources: [] },
        spam: { isSpamListed: false, spamScore: 0, sources: [] },
        phishing: { isPhishingSite: false, sources: [] },
        timestamp: new Date(),
      };

      const summary = securityAPI.getSecuritySummary(analysis);
      expect(summary.warnings).toContain('SSL certificate has expired');
    });

    it('warns about new domains', () => {
      const analysis: SecurityAnalysis = {
        domain: 'example.com',
        reputation: { trustScore: 50, ageScore: 10, riskLevel: 'MEDIUM', reasons: [] },
        blacklists: { isBlacklisted: false, sources: [], categories: [] },
        domainAge: { ageInDays: 30, ageInYears: 0.1, isMatureDomain: false, isNewDomain: true },
        ownership: { hasChangedOwners: false, ownershipStability: 'UNKNOWN' },
        legal: { hasTrademarkIssues: false, hasLegalDisputes: false, notes: [] },
        ssl: { hasCertificate: true, isExpired: false },
        malware: { detected: false, sources: [] },
        spam: { isSpamListed: false, spamScore: 0, sources: [] },
        phishing: { isPhishingSite: false, sources: [] },
        timestamp: new Date(),
      };

      const summary = securityAPI.getSecuritySummary(analysis);
      expect(summary.warnings).toContain('Domain is less than 6 months old');
    });

    it('warns about blacklisted domains', () => {
      const analysis: SecurityAnalysis = {
        domain: 'example.com',
        reputation: { trustScore: 20, ageScore: 50, riskLevel: 'HIGH', reasons: [] },
        blacklists: { isBlacklisted: true, sources: ['Spamhaus', 'SURBL'], categories: ['spam'] },
        domainAge: { ageInDays: 365, ageInYears: 1, isMatureDomain: false, isNewDomain: false },
        ownership: { hasChangedOwners: false, ownershipStability: 'UNKNOWN' },
        legal: { hasTrademarkIssues: false, hasLegalDisputes: false, notes: [] },
        ssl: { hasCertificate: true, isExpired: false },
        malware: { detected: false, sources: [] },
        spam: { isSpamListed: false, spamScore: 0, sources: [] },
        phishing: { isPhishingSite: false, sources: [] },
        timestamp: new Date(),
      };

      const summary = securityAPI.getSecuritySummary(analysis);
      expect(summary.warnings).toContain('Listed on 2 blacklist(s)');
      expect(summary.warnings).toContain('Low trust score detected');
    });
  });
});
