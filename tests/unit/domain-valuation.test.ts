import { describe, it, expect } from 'vitest';
import { domainValuation } from '@/lib/intelligence/domain-valuation';
import { scoreBrandability, isPronounceable } from '@/lib/intelligence/brandability';
import { findComparableSales, getAllSales } from '@/lib/intelligence/domain-comparables';
import type { WhoisData } from '@/lib/external-apis/whois';
import type { SEOAnalysis } from '@/lib/external-apis/seo';
import type { SecurityAnalysis } from '@/lib/external-apis/security';
import type { WebsiteAnalysis } from '@/lib/external-apis/website-analyzer';

// ---------------------------------------------------------------------------
// Helpers to create mock enrichment data
// ---------------------------------------------------------------------------

function makeWhoisData(overrides: Partial<WhoisData> = {}): WhoisData {
  return {
    domain: 'test.com',
    privacy: { isPrivate: false },
    locks: { transferLocked: false, updateLocked: false, deleteLocked: false },
    transferInfo: { isEligible: true, authCodeRequired: true },
    ...overrides,
  };
}

function makeSeoData(overrides: Partial<SEOAnalysis> = {}): SEOAnalysis {
  return {
    domain: 'test.com',
    domainAuthority: { score: 50, calculation: 'test' },
    backlinks: { estimatedTotal: 5000, fromWayback: 100, quality: 'MEDIUM' },
    content: {
      totalPages: 100,
      indexedPages: 80,
      archivedPages: 100,
      contentAge: {},
    },
    traffic: {
      estimatedMonthlyVisits: 10000,
      trafficTrend: 'STABLE',
    },
    keywords: { estimatedRanking: 0, topKeywords: [], visibility: 50 },
    social: { mentions: 0, platforms: [] },
    history: { ageInYears: 10, significantEvents: [] },
    seoHealth: { score: 70, issues: [], recommendations: [] },
    timestamp: new Date(),
    ...overrides,
  };
}

function makeSecurityData(overrides: Partial<SecurityAnalysis> = {}): SecurityAnalysis {
  return {
    domain: 'test.com',
    reputation: { trustScore: 75, ageScore: 70, riskLevel: 'LOW', reasons: [] },
    blacklists: { isBlacklisted: false, sources: [], categories: [] },
    domainAge: { ageInDays: 3650, ageInYears: 10, isNewDomain: false, isMatureDomain: true },
    ownership: { hasChangedOwners: false, ownershipStability: 'STABLE' },
    legal: { hasTrademarkIssues: false, hasLegalDisputes: false, notes: [] },
    ssl: { hasCertificate: true, isExpired: false },
    malware: { detected: false, sources: [] },
    spam: { isSpamListed: false, spamScore: 0, sources: [] },
    phishing: { isPhishingSite: false, sources: [] },
    timestamp: new Date(),
    ...overrides,
  };
}

function makeWebsiteData(overrides: Partial<WebsiteAnalysis> = {}): WebsiteAnalysis {
  return {
    domain: 'test.com',
    isOnline: true,
    httpStatus: 200,
    responseTime: 150,
    ssl: { enabled: true },
    server: {},
    technologies: {},
    headers: {},
    hosting: { usingCDN: false },
    security: { hasHSTS: true, hasCSP: true, hasXFrameOptions: true, securityScore: 75 },
    performance: { redirects: 0, compressionEnabled: true, cachingEnabled: true },
    timestamp: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Domain Valuation Engine Tests
// ---------------------------------------------------------------------------

describe('DomainValuationEngine', () => {
  describe('estimate()', () => {
    it('returns the correct interface shape', () => {
      const result = domainValuation.estimate('example.com');

      expect(result).toHaveProperty('domain', 'example.com');
      expect(result).toHaveProperty('estimatedValue');
      expect(result.estimatedValue).toHaveProperty('low');
      expect(result.estimatedValue).toHaveProperty('mid');
      expect(result.estimatedValue).toHaveProperty('high');
      expect(result.estimatedValue).toHaveProperty('currency', 'USD');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('comparables');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('always returns low <= mid <= high', () => {
      const domains = [
        'a.com', 'google.com', 'my-very-long-random-site.info',
        'crypto.io', 'test.xyz',
      ];
      for (const d of domains) {
        const r = domainValuation.estimate(d);
        expect(r.estimatedValue.low).toBeLessThanOrEqual(r.estimatedValue.mid);
        expect(r.estimatedValue.mid).toBeLessThanOrEqual(r.estimatedValue.high);
      }
    });

    it('returns exactly 7 scoring factors', () => {
      const result = domainValuation.estimate('example.com');
      expect(result.factors).toHaveLength(7);

      const names = result.factors.map((f) => f.name);
      expect(names).toContain('Domain Length');
      expect(names).toContain('TLD Value');
      expect(names).toContain('Keyword Value');
      expect(names).toContain('Domain Age');
      expect(names).toContain('SEO Metrics');
      expect(names).toContain('Brandability');
      expect(names).toContain('Market Comparables');
    });

    it('factor weights sum to 1.0', () => {
      const result = domainValuation.estimate('example.com');
      const totalWeight = result.factors.reduce((s, f) => s + f.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });
  });

  // -------------------------------------------------------------------------
  // Premium domain valuations
  // -------------------------------------------------------------------------

  describe('premium domain valuations', () => {
    it('values google.com as a solid domain even without enrichment', () => {
      const result = domainValuation.estimate('google.com');

      // "google" is a coined/invented word (not a dictionary keyword),
      // so without SEO/traffic enrichment data the heuristic engine
      // recognizes it as a good 6-letter .com but cannot know it is THE
      // most visited website. The grade should still be respectable.
      expect(['A+', 'A', 'B+', 'B']).toContain(result.grade);
      expect(result.estimatedValue.mid).toBeGreaterThan(1_000);
    });

    it('values short .com domains highly', () => {
      const resultA = domainValuation.estimate('a.com');
      const resultAB = domainValuation.estimate('ab.com');
      const resultCar = domainValuation.estimate('car.com');

      // Single letter .com — ultra-premium scarcity
      expect(resultA.estimatedValue.mid).toBeGreaterThan(500_000);
      expect(resultA.grade).toBe('A+');

      // Two letter .com
      expect(resultAB.estimatedValue.mid).toBeGreaterThan(100_000);
      expect(['A+', 'A']).toContain(resultAB.grade);

      // Short premium keyword .com (3-letter "car")
      expect(resultCar.estimatedValue.mid).toBeGreaterThan(50_000);
    });

    it('values premium single-word .com domains in a realistic range', () => {
      // Premium single-word .com like "cloud", "trade", "hotel"
      // Without SEO enrichment, the heuristic places these in the
      // $50k-$500k range (mid estimate).
      const cloudResult = domainValuation.estimate('cloud.com');
      expect(cloudResult.estimatedValue.low).toBeGreaterThanOrEqual(10_000);
      expect(cloudResult.estimatedValue.mid).toBeGreaterThan(50_000);

      const tradeResult = domainValuation.estimate('trade.com');
      expect(tradeResult.estimatedValue.mid).toBeGreaterThan(50_000);
    });
  });

  // -------------------------------------------------------------------------
  // Low-value domain valuations
  // -------------------------------------------------------------------------

  describe('low-value domain valuations', () => {
    it('values long hyphenated domains at near-worthless levels', () => {
      const result = domainValuation.estimate('my-super-long-hyphenated-domain-name.info');

      expect(result.estimatedValue.mid).toBeLessThan(100);
      expect(result.estimatedValue.low).toBeGreaterThanOrEqual(1);
      expect(['D', 'F']).toContain(result.grade);
    });

    it('penalizes hyphens in brandability factor', () => {
      const cleanResult = domainValuation.estimate('cloudmarket.com');
      const hyphenResult = domainValuation.estimate('cloud-market.com');

      const cleanBrand = cleanResult.factors.find((f) => f.name === 'Brandability');
      const hyphenBrand = hyphenResult.factors.find((f) => f.name === 'Brandability');

      expect(cleanBrand!.score).toBeGreaterThan(hyphenBrand!.score);
    });

    it('values niche TLDs lower than .com', () => {
      const comResult = domainValuation.estimate('test.com');
      const xyzResult = domainValuation.estimate('test.xyz');
      const infoResult = domainValuation.estimate('test.info');

      expect(comResult.estimatedValue.mid).toBeGreaterThan(xyzResult.estimatedValue.mid);
      expect(comResult.estimatedValue.mid).toBeGreaterThan(infoResult.estimatedValue.mid);
    });
  });

  // -------------------------------------------------------------------------
  // Confidence scoring
  // -------------------------------------------------------------------------

  describe('confidence scoring', () => {
    it('has baseline confidence of 25 with no enrichment data', () => {
      const result = domainValuation.estimate('example.com');
      expect(result.confidence).toBe(25);
    });

    it('increases confidence with WHOIS data', () => {
      const whois = makeWhoisData({
        createdDate: new Date('2010-01-01'),
      });
      const result = domainValuation.estimate('example.com', whois);
      expect(result.confidence).toBeGreaterThan(25);
    });

    it('increases confidence with SEO data', () => {
      const seo = makeSeoData();
      const result = domainValuation.estimate('example.com', undefined, seo);
      expect(result.confidence).toBeGreaterThan(25);
    });

    it('has highest confidence with all data sources', () => {
      const whois = makeWhoisData({ createdDate: new Date('2005-03-15') });
      const seo = makeSeoData();
      const security = makeSecurityData();
      const website = makeWebsiteData();

      const minimal = domainValuation.estimate('example.com');
      const full = domainValuation.estimate('example.com', whois, seo, security, website);

      expect(full.confidence).toBeGreaterThan(minimal.confidence);
      expect(full.confidence).toBeGreaterThanOrEqual(75);
    });

    it('increments confidence for each additional data source', () => {
      const whois = makeWhoisData({ createdDate: new Date('2005-03-15') });
      const seo = makeSeoData();
      const security = makeSecurityData();
      const website = makeWebsiteData();

      const c0 = domainValuation.estimate('example.com').confidence;
      const c1 = domainValuation.estimate('example.com', whois).confidence;
      const c2 = domainValuation.estimate('example.com', whois, seo).confidence;
      const c3 = domainValuation.estimate('example.com', whois, seo, security).confidence;
      const c4 = domainValuation.estimate('example.com', whois, seo, security, website).confidence;

      expect(c1).toBeGreaterThan(c0);
      expect(c2).toBeGreaterThan(c1);
      expect(c3).toBeGreaterThan(c2);
      expect(c4).toBeGreaterThan(c3);
    });
  });

  // -------------------------------------------------------------------------
  // Grade system
  // -------------------------------------------------------------------------

  describe('grade system', () => {
    it('assigns A+ for premium single-letter .com', () => {
      const result = domainValuation.estimate('a.com');
      expect(result.grade).toBe('A+');
    });

    it('assigns F or D for poor domains', () => {
      const result = domainValuation.estimate(
        'this-is-a-really-long-and-terrible-domain-name-with-no-value.biz'
      );
      expect(['F', 'D']).toContain(result.grade);
    });

    it('assigns middle grades for average domains', () => {
      const result = domainValuation.estimate('mywebsite.net');
      // should be somewhere in B-D range
      expect(['B+', 'B', 'C+', 'C', 'D']).toContain(result.grade);
    });
  });

  // -------------------------------------------------------------------------
  // SEO enrichment impact
  // -------------------------------------------------------------------------

  describe('SEO enrichment impact', () => {
    it('higher SEO metrics increase valuation', () => {
      const lowSeo = makeSeoData({
        domainAuthority: { score: 10, calculation: 'low' },
        backlinks: { estimatedTotal: 50, fromWayback: 10, quality: 'LOW' },
        traffic: { estimatedMonthlyVisits: 100, trafficTrend: 'DECLINING' },
      });

      const highSeo = makeSeoData({
        domainAuthority: { score: 80, calculation: 'high' },
        backlinks: { estimatedTotal: 100000, fromWayback: 5000, quality: 'HIGH' },
        traffic: { estimatedMonthlyVisits: 500000, trafficTrend: 'GROWING' },
      });

      const lowResult = domainValuation.estimate('testdomain.com', undefined, lowSeo);
      const highResult = domainValuation.estimate('testdomain.com', undefined, highSeo);

      expect(highResult.estimatedValue.mid).toBeGreaterThan(lowResult.estimatedValue.mid);
    });
  });

  // -------------------------------------------------------------------------
  // Domain age impact
  // -------------------------------------------------------------------------

  describe('domain age impact', () => {
    it('older domains receive higher age factor scores', () => {
      const youngWhois = makeWhoisData({
        createdDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months
      });
      const oldWhois = makeWhoisData({
        createdDate: new Date('2000-01-01'), // ~25 years
      });

      const young = domainValuation.estimate('testsite.com', youngWhois);
      const old = domainValuation.estimate('testsite.com', oldWhois);

      const youngAge = young.factors.find((f) => f.name === 'Domain Age')!;
      const oldAge = old.factors.find((f) => f.name === 'Domain Age')!;

      expect(oldAge.score).toBeGreaterThan(youngAge.score);
    });
  });
});

// ---------------------------------------------------------------------------
// Brandability Scorer Tests
// ---------------------------------------------------------------------------

describe('Brandability Scorer', () => {
  describe('scoreBrandability()', () => {
    it('gives high scores to short clean names', () => {
      const result = scoreBrandability('spark.com');
      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it('penalizes hyphenated names', () => {
      const clean = scoreBrandability('cloud.com');
      const hyphen = scoreBrandability('cloud-market.com');
      expect(clean.score).toBeGreaterThan(hyphen.score);
    });

    it('penalizes names with numbers', () => {
      const clean = scoreBrandability('trade.com');
      const numbered = scoreBrandability('trade24.com');
      expect(clean.score).toBeGreaterThan(numbered.score);
    });

    it('penalizes very long names', () => {
      const short = scoreBrandability('fox.com');
      const long = scoreBrandability('my-really-long-website-name-here.com');
      expect(short.score).toBeGreaterThan(long.score);
    });

    it('returns score in 0-100 range', () => {
      const domains = [
        'a.com', 'xyz.io', 'super-long-hyphenated-domain-here.biz',
        'cloud.com', 'test123.net',
      ];
      for (const d of domains) {
        const result = scoreBrandability(d);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });

    it('has a breakdown that sums close to the total score', () => {
      const result = scoreBrandability('hello.com');
      const breakdownSum =
        result.breakdown.pronounceability +
        result.breakdown.length +
        result.breakdown.cleanness +
        result.breakdown.phonetics +
        result.breakdown.memorability;
      // The total score is capped at 100, but breakdown sum should equal it
      expect(breakdownSum).toBe(result.score);
    });
  });

  describe('isPronounceable()', () => {
    it('gives high scores to pronounceable words', () => {
      expect(isPronounceable('hello')).toBeGreaterThan(60);
      expect(isPronounceable('spark')).toBeGreaterThan(50);
      expect(isPronounceable('cloud')).toBeGreaterThan(50);
      expect(isPronounceable('table')).toBeGreaterThan(60);
    });

    it('gives low scores to unpronounceable strings', () => {
      expect(isPronounceable('xkcd')).toBeLessThan(50);
      expect(isPronounceable('bfgxz')).toBeLessThan(30);
      expect(isPronounceable('qwrtp')).toBeLessThan(40);
    });

    it('returns 0-100 range', () => {
      const words = ['a', 'cloud', 'xkcd', 'hello', 'zzzz', 'beautiful'];
      for (const w of words) {
        const score = isPronounceable(w);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Comparable Sales Database Tests
// ---------------------------------------------------------------------------

describe('Domain Comparables', () => {
  describe('findComparableSales()', () => {
    it('returns up to the requested number of results', () => {
      const results = findComparableSales('test.com', 3);
      expect(results.length).toBeLessThanOrEqual(3);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns results sorted by similarity descending', () => {
      const results = findComparableSales('cloud.com', 10);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it('prefers .com comparables for .com domains', () => {
      const results = findComparableSales('trade.com', 5);
      const comCount = results.filter((r) => r.tld === 'com').length;
      // Most top results should be .com
      expect(comCount).toBeGreaterThanOrEqual(2);
    });

    it('includes similarity scores in 0-100 range', () => {
      const results = findComparableSales('data.io', 5);
      for (const r of results) {
        expect(r.similarity).toBeGreaterThanOrEqual(0);
        expect(r.similarity).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getAllSales()', () => {
    it('contains at least 50 entries', () => {
      const all = getAllSales();
      expect(all.length).toBeGreaterThanOrEqual(50);
    });

    it('each entry has required fields', () => {
      const all = getAllSales();
      for (const sale of all) {
        expect(sale).toHaveProperty('domain');
        expect(sale).toHaveProperty('salePrice');
        expect(sale).toHaveProperty('date');
        expect(sale).toHaveProperty('category');
        expect(sale.salePrice).toBeGreaterThan(0);
      }
    });
  });
});
