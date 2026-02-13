/**
 * Comprehensive Domain Valuation Engine
 * Produces realistic market-value estimates using multiple scoring factors
 */

import { scoreBrandability } from './brandability';
import { findComparableSales, getMedianPrice } from './domain-comparables';
import type { WhoisData } from '../external-apis/whois';
import type { SEOAnalysis } from '../external-apis/seo';
import type { SecurityAnalysis } from '../external-apis/security';
import type { WebsiteAnalysis } from '../external-apis/website-analyzer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValuationGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface ValuationFactor {
  name: string;
  score: number;      // 0-100 raw score for this factor
  weight: number;     // 0-1 weight (sums to 1.0 across all factors)
  impact: 'positive' | 'neutral' | 'negative';
  detail: string;
}

export interface DomainValuation {
  domain: string;
  estimatedValue: {
    low: number;
    mid: number;
    high: number;
    currency: string;
  };
  confidence: number; // 0-100
  factors: ValuationFactor[];
  comparables: Array<{
    domain: string;
    salePrice: number;
    date: string;
    similarity: number;
  }>;
  grade: ValuationGrade;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * TLD value tiers – higher multiplier = more valuable
 */
const TLD_VALUES: Record<string, number> = {
  com: 1.0,
  ai: 0.55,
  io: 0.40,
  co: 0.35,
  net: 0.30,
  org: 0.28,
  dev: 0.25,
  app: 0.25,
  xyz: 0.12,
  info: 0.10,
  biz: 0.08,
  me: 0.18,
  us: 0.12,
  uk: 0.15,
  de: 0.15,
  ca: 0.12,
  tv: 0.20,
};

const DEFAULT_TLD_VALUE = 0.08;

/**
 * High-value single-word dictionary keywords.
 * These are words that carry significant commercial intent.
 */
const PREMIUM_KEYWORDS = new Set([
  // Finance
  'insurance', 'mortgage', 'credit', 'loan', 'bank', 'invest', 'fund',
  'finance', 'money', 'pay', 'trade', 'stock', 'wealth', 'capital',
  // Tech
  'cloud', 'data', 'crypto', 'blockchain', 'ai', 'app', 'code', 'tech',
  'digital', 'software', 'cyber', 'web', 'mobile', 'api', 'nft',
  // Health
  'health', 'medical', 'doctor', 'pharmacy', 'dental', 'fitness',
  'insurance', 'therapy', 'care',
  // Travel
  'hotel', 'travel', 'flight', 'booking', 'cruise', 'resort', 'vacation',
  // Real estate
  'house', 'home', 'property', 'estate', 'rent', 'apartment', 'land',
  // E-commerce
  'shop', 'store', 'buy', 'deal', 'market', 'sale', 'retail',
  // Other high-value
  'car', 'auto', 'food', 'game', 'video', 'music', 'news', 'media',
  'sport', 'energy', 'power', 'gold', 'diamond', 'luxury', 'wine',
  'beer', 'casino', 'poker', 'sex', 'dating', 'jobs', 'career',
]);

/**
 * Common dictionary words that enhance domain value
 */
const DICTIONARY_WORDS = new Set([
  ...Array.from(PREMIUM_KEYWORDS),
  'blue', 'green', 'red', 'black', 'white', 'dark', 'light', 'bright',
  'fast', 'quick', 'smart', 'simple', 'easy', 'clean', 'clear', 'fresh',
  'open', 'free', 'true', 'bold', 'pure', 'cool', 'hot', 'fire',
  'star', 'sun', 'moon', 'sky', 'air', 'water', 'ocean', 'lake',
  'rock', 'stone', 'iron', 'steel', 'wave', 'peak', 'edge', 'core',
  'link', 'hub', 'box', 'key', 'map', 'guide', 'path', 'flow',
  'snap', 'flex', 'zoom', 'glow', 'spark', 'pulse', 'beam', 'dash',
  'nest', 'hive', 'base', 'zone', 'grid', 'mesh', 'loop', 'node',
  'seed', 'bloom', 'grove', 'leaf', 'pine', 'oak', 'wolf', 'hawk',
  'fox', 'bear', 'lion', 'tiger', 'eagle', 'swift', 'brave', 'noble',
  'quest', 'venture', 'voyage', 'craft', 'forge', 'mint', 'vault',
]);

// ---------------------------------------------------------------------------
// Valuation Engine
// ---------------------------------------------------------------------------

class DomainValuationEngine {
  /**
   * Produce a comprehensive valuation for a domain.
   *
   * The optional enrichment data (whois, seo, security, website) increases
   * confidence but is not required — the engine falls back to heuristics.
   */
  estimate(
    domain: string,
    whoisData?: WhoisData,
    seoData?: SEOAnalysis,
    securityData?: SecurityAnalysis,
    websiteData?: WebsiteAnalysis
  ): DomainValuation {
    const clean = domain.toLowerCase().trim();
    const parts = clean.split('.');
    const name = parts[0];
    const tld = parts.slice(1).join('.');

    // Calculate each factor
    const factors: ValuationFactor[] = [
      this.scoreDomainLength(name),
      this.scoreTLD(tld),
      this.scoreKeywordValue(name),
      this.scoreDomainAge(whoisData, securityData),
      this.scoreSEO(seoData),
      this.scoreBrandability(name),
      this.scoreMarketComparables(clean),
    ];

    // Compute weighted composite score (0-100)
    let compositeScore = factors.reduce(
      (sum, f) => sum + f.score * f.weight,
      0
    );

    // Ultra-premium boost: 1-2 letter .com domains are inherently top-tier
    // regardless of individual factor scores. Without enrichment data,
    // SEO and age scores drag down what should be an A+ domain.
    const cleanLen = name.replace(/-/g, '').length;
    if (tld === 'com' && cleanLen <= 2) {
      compositeScore = Math.max(compositeScore, 82);
    } else if (tld === 'com' && cleanLen === 3 && !/\d/.test(name) && !name.includes('-')) {
      compositeScore = Math.max(compositeScore, 72);
    }

    // Determine confidence based on data availability
    const confidence = this.calculateConfidence(whoisData, seoData, securityData, websiteData);

    // Fetch comparable sales
    const rawComps = findComparableSales(clean, 5);
    const comparables = rawComps.map((c) => ({
      domain: c.domain,
      salePrice: c.salePrice,
      date: c.date,
      similarity: c.similarity,
    }));

    // Calculate weighted comp anchor (only use comps with decent similarity)
    const relevantComps = rawComps.filter((c) => c.similarity >= 40);
    const compAnchor =
      relevantComps.length > 0
        ? relevantComps.reduce((s, c) => s + c.salePrice * (c.similarity / 100), 0) /
          relevantComps.reduce((s, c) => s + c.similarity / 100, 0)
        : undefined;

    // Convert composite score to dollar value using a logarithmic scale
    const { low, mid, high } = this.scoreToDollarValue(
      compositeScore,
      name,
      tld,
      compAnchor
    );

    const grade = this.scoreToGrade(compositeScore);

    return {
      domain: clean,
      estimatedValue: {
        low: Math.round(low),
        mid: Math.round(mid),
        high: Math.round(high),
        currency: 'USD',
      },
      confidence,
      factors,
      comparables,
      grade,
      timestamp: new Date(),
    };
  }

  // -----------------------------------------------------------------------
  // Factor scorers — each returns a ValuationFactor with score 0-100
  // -----------------------------------------------------------------------

  /**
   * Factor 1: Domain Length — shorter is better (weight 0.20)
   */
  private scoreDomainLength(name: string): ValuationFactor {
    const len = name.replace(/-/g, '').length;
    let score: number;
    let detail: string;

    if (len === 1) {
      score = 100;
      detail = 'Single character — extremely rare and valuable';
    } else if (len === 2) {
      score = 95;
      detail = 'Two characters — highly sought after';
    } else if (len === 3) {
      score = 88;
      detail = 'Three characters — premium short domain';
    } else if (len === 4) {
      score = 78;
      detail = 'Four characters — very desirable length';
    } else if (len === 5) {
      score = 68;
      detail = 'Five characters — strong brandable length';
    } else if (len <= 7) {
      score = 55;
      detail = `${len} characters — good length for branding`;
    } else if (len <= 10) {
      score = 38;
      detail = `${len} characters — acceptable but not ideal`;
    } else if (len <= 14) {
      score = 22;
      detail = `${len} characters — lengthy, harder to brand`;
    } else if (len <= 20) {
      score = 10;
      detail = `${len} characters — very long, low brandability`;
    } else {
      score = 3;
      detail = `${len} characters — excessively long`;
    }

    return {
      name: 'Domain Length',
      score,
      weight: 0.20,
      impact: score >= 60 ? 'positive' : score >= 30 ? 'neutral' : 'negative',
      detail,
    };
  }

  /**
   * Factor 2: TLD Value — .com is king (weight 0.15)
   */
  private scoreTLD(tld: string): ValuationFactor {
    const value = TLD_VALUES[tld] ?? DEFAULT_TLD_VALUE;
    const score = Math.round(value * 100);

    let detail: string;
    if (tld === 'com') {
      detail = '.com — the most valuable and universally recognized TLD';
    } else if (value >= 0.40) {
      detail = `.${tld} — premium alternative TLD with strong market demand`;
    } else if (value >= 0.20) {
      detail = `.${tld} — respectable TLD with moderate market value`;
    } else {
      detail = `.${tld} — lower-tier TLD, significantly less valuable than .com`;
    }

    return {
      name: 'TLD Value',
      score,
      weight: 0.15,
      impact: score >= 50 ? 'positive' : score >= 20 ? 'neutral' : 'negative',
      detail,
    };
  }

  /**
   * Factor 3: Keyword Value — dictionary words and premium keywords (weight 0.15)
   *
   * Ultra-short domains (1-3 chars) receive a scarcity bonus because their
   * value derives from extreme scarcity rather than keyword meaning.
   */
  private scoreKeywordValue(name: string): ValuationFactor {
    const cleanName = name.replace(/-/g, '').toLowerCase();
    let score = 20; // baseline for a non-keyword domain
    let detail: string;

    // Ultra-short domains: scarcity IS the keyword value
    if (cleanName.length === 1) {
      score = 90;
      detail = 'Single-character domain — extreme scarcity drives value';
    } else if (cleanName.length === 2) {
      score = 85;
      detail = 'Two-character domain — very scarce, high intrinsic value';
    } else if (cleanName.length === 3 && !/\d/.test(cleanName)) {
      score = 75;
      detail = 'Three-letter domain — limited supply, inherently valuable';
    }
    // Check exact premium keyword match
    else if (PREMIUM_KEYWORDS.has(cleanName)) {
      score = 95;
      detail = `"${cleanName}" is a high-value commercial keyword`;
    }
    // Check exact dictionary word match
    else if (DICTIONARY_WORDS.has(cleanName)) {
      score = 80;
      detail = `"${cleanName}" is a recognized dictionary/brand word`;
    }
    // Check if the name contains premium keywords
    else {
      const containedPremium: string[] = [];
      const containedDictionary: string[] = [];

      Array.from(PREMIUM_KEYWORDS).forEach((kw) => {
        if (cleanName.includes(kw) && kw.length >= 3) {
          containedPremium.push(kw);
        }
      });
      Array.from(DICTIONARY_WORDS).forEach((kw) => {
        if (cleanName.includes(kw) && kw.length >= 3 && !containedPremium.includes(kw)) {
          containedDictionary.push(kw);
        }
      });

      if (containedPremium.length >= 2) {
        score = 75;
        detail = `Contains premium keywords: ${containedPremium.slice(0, 3).join(', ')}`;
      } else if (containedPremium.length === 1) {
        score = 60;
        detail = `Contains premium keyword: "${containedPremium[0]}"`;
      } else if (containedDictionary.length >= 2) {
        score = 50;
        detail = `Contains dictionary words: ${containedDictionary.slice(0, 3).join(', ')}`;
      } else if (containedDictionary.length === 1) {
        score = 40;
        detail = `Contains dictionary word: "${containedDictionary[0]}"`;
      } else {
        score = 15;
        detail = 'No recognized keywords — value relies on other factors';
      }
    }

    return {
      name: 'Keyword Value',
      score,
      weight: 0.15,
      impact: score >= 60 ? 'positive' : score >= 30 ? 'neutral' : 'negative',
      detail,
    };
  }

  /**
   * Factor 4: Domain Age — older = more trustworthy (weight 0.10)
   */
  private scoreDomainAge(
    whoisData?: WhoisData,
    securityData?: SecurityAnalysis
  ): ValuationFactor {
    let ageYears = 0;

    if (whoisData?.createdDate) {
      const created = new Date(whoisData.createdDate);
      if (!isNaN(created.getTime())) {
        ageYears = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      }
    } else if (securityData?.domainAge?.ageInYears) {
      ageYears = securityData.domainAge.ageInYears;
    }

    let score: number;
    let detail: string;

    if (ageYears === 0) {
      score = 30; // unknown, give neutral-ish score
      detail = 'Domain age unknown — limited data available';
    } else if (ageYears >= 20) {
      score = 100;
      detail = `${Math.floor(ageYears)} years old — veteran domain with maximum age authority`;
    } else if (ageYears >= 15) {
      score = 90;
      detail = `${Math.floor(ageYears)} years old — highly established domain`;
    } else if (ageYears >= 10) {
      score = 75;
      detail = `${Math.floor(ageYears)} years old — mature, well-established domain`;
    } else if (ageYears >= 5) {
      score = 55;
      detail = `${Math.floor(ageYears)} years old — established domain`;
    } else if (ageYears >= 2) {
      score = 35;
      detail = `${Math.floor(ageYears)} years old — relatively young`;
    } else if (ageYears >= 1) {
      score = 20;
      detail = `${Math.floor(ageYears * 12)} months old — new domain`;
    } else {
      score = 10;
      detail = 'Less than 1 year old — very new domain';
    }

    return {
      name: 'Domain Age',
      score,
      weight: 0.10,
      impact: score >= 55 ? 'positive' : score >= 25 ? 'neutral' : 'negative',
      detail,
    };
  }

  /**
   * Factor 5: SEO Metrics — DA, backlinks, traffic (weight 0.20)
   */
  private scoreSEO(seoData?: SEOAnalysis): ValuationFactor {
    if (!seoData) {
      return {
        name: 'SEO Metrics',
        score: 25,
        weight: 0.20,
        impact: 'neutral',
        detail: 'No SEO data available — using baseline estimate',
      };
    }

    let score = 0;
    const details: string[] = [];

    // Domain authority (0-100, worth up to 40 points)
    const da = seoData.domainAuthority?.score ?? 0;
    score += (da / 100) * 40;
    if (da > 0) details.push(`DA: ${da}`);

    // Backlinks (worth up to 30 points)
    const backlinks = seoData.backlinks?.estimatedTotal ?? 0;
    if (backlinks > 0) {
      const blScore = Math.min(30, Math.log10(backlinks + 1) * 6);
      score += blScore;
      details.push(`~${backlinks.toLocaleString()} backlinks`);
    }

    // Traffic (worth up to 30 points)
    const traffic = seoData.traffic?.estimatedMonthlyVisits ?? 0;
    if (traffic > 0) {
      const tScore = Math.min(30, Math.log10(traffic + 1) * 5);
      score += tScore;
      details.push(`~${traffic.toLocaleString()} monthly visits`);
    }

    score = Math.min(100, Math.round(score));

    return {
      name: 'SEO Metrics',
      score,
      weight: 0.20,
      impact: score >= 50 ? 'positive' : score >= 20 ? 'neutral' : 'negative',
      detail: details.length > 0 ? details.join(', ') : 'Minimal SEO signals detected',
    };
  }

  /**
   * Factor 6: Brandability — pronounceable, memorable, clean (weight 0.10)
   */
  private scoreBrandability(name: string): ValuationFactor {
    const result = scoreBrandability(name);
    const score = result.score;

    let detail: string;
    if (score >= 80) {
      detail = 'Excellent brandability — short, clean, and pronounceable';
    } else if (score >= 60) {
      detail = 'Good brandability — easy to remember and share';
    } else if (score >= 40) {
      detail = 'Moderate brandability — some friction for branding';
    } else if (score >= 20) {
      detail = 'Low brandability — hyphens, numbers, or difficult pronunciation';
    } else {
      detail = 'Poor brandability — very hard to brand effectively';
    }

    if (result.flags.length > 0) {
      detail += ` (${result.flags.slice(0, 3).join('; ')})`;
    }

    return {
      name: 'Brandability',
      score,
      weight: 0.10,
      impact: score >= 55 ? 'positive' : score >= 30 ? 'neutral' : 'negative',
      detail,
    };
  }

  /**
   * Factor 7: Market Comparables — reference recent sales (weight 0.10)
   */
  private scoreMarketComparables(domain: string): ValuationFactor {
    const parts = domain.split('.');
    const name = parts[0];
    const tld = parts.slice(1).join('.');
    const hasHyphens = name.includes('-');

    const medianPrice = getMedianPrice(tld, name.length, hasHyphens);

    let score: number;
    if (medianPrice >= 1_000_000) score = 95;
    else if (medianPrice >= 500_000) score = 85;
    else if (medianPrice >= 100_000) score = 70;
    else if (medianPrice >= 50_000) score = 55;
    else if (medianPrice >= 10_000) score = 40;
    else if (medianPrice >= 5_000) score = 30;
    else if (medianPrice >= 1_000) score = 20;
    else score = 10;

    const detail = `Comparable domains trade at a median of $${medianPrice.toLocaleString()}`;

    return {
      name: 'Market Comparables',
      score,
      weight: 0.10,
      impact: score >= 50 ? 'positive' : score >= 25 ? 'neutral' : 'negative',
      detail,
    };
  }

  // -----------------------------------------------------------------------
  // Value conversion
  // -----------------------------------------------------------------------

  /**
   * Convert composite score (0-100) to a realistic dollar range.
   *
   * The mapping uses a logarithmic scale so that:
   *   Score   0 → ~$8          (floor for worthless domains)
   *   Score  20 → ~$50-$100
   *   Score  40 → ~$500-$2,000
   *   Score  60 → ~$5,000-$25,000
   *   Score  80 → ~$50,000-$500,000
   *   Score 100 → ~$500,000-$5,000,000+
   *
   * Comparable sale data anchors the estimate when available.
   */
  private scoreToDollarValue(
    score: number,
    name: string,
    tld: string,
    compAnchor?: number
  ): { low: number; mid: number; high: number } {
    // Logarithmic base value: 10^(score/16) gives a range from 1 to ~1,000,000
    // This steeper curve ensures premium domains (score 70+) reach realistic
    // values while low-score domains stay near the floor.
    const baseValue = Math.pow(10, score / 16);

    // TLD multiplier
    const tldMult = TLD_VALUES[tld] ?? DEFAULT_TLD_VALUE;

    // Length bonus — short single-word .com domains get premium multiplier
    let lengthMult = 1;
    const cleanLen = name.replace(/-/g, '').length;
    if (cleanLen === 1) lengthMult = 40;
    else if (cleanLen === 2) lengthMult = 20;
    else if (cleanLen === 3) lengthMult = 8;
    else if (cleanLen === 4) lengthMult = 3;
    else if (cleanLen === 5) lengthMult = 1.5;
    else if (cleanLen >= 20) lengthMult = 0.08;
    else if (cleanLen >= 15) lengthMult = 0.15;
    else if (cleanLen >= 12) lengthMult = 0.35;

    // Hyphen / number penalty — stacks with length
    const hasHyphens = name.includes('-');
    const hasNumbers = /\d/.test(name);
    let cleanPenalty = 1;
    if (hasHyphens) {
      const hyphenCount = (name.match(/-/g) || []).length;
      cleanPenalty *= Math.max(0.05, 0.3 - (hyphenCount - 1) * 0.08);
    }
    if (hasNumbers && cleanLen > 3) cleanPenalty *= 0.4;

    // Raw mid estimate
    let mid = baseValue * tldMult * lengthMult * cleanPenalty;

    // Anchor to comparable data if available.
    // Only blend comps when the heuristic score is decent (score > 40);
    // for lower-score domains the comps can be misleadingly high due to
    // partial similarity matches against premium domains.
    // Additionally, cap the comp anchor so it cannot exceed 10x the
    // heuristic value — this prevents a $30 heuristic domain from being
    // pulled up to millions by loosely similar premium sales.
    if (compAnchor && compAnchor > 0 && isFinite(compAnchor) && score > 40) {
      const compWeight = Math.min(0.35, score / 250);
      const cappedAnchor = Math.min(compAnchor, mid * 10);
      mid = mid * (1 - compWeight) + cappedAnchor * compWeight;
    }

    // Apply realistic floor and ceiling
    mid = Math.max(8, mid);

    // Spread: +-50% for the range
    const low = mid * 0.5;
    const high = mid * 2.0;

    return { low, mid, high };
  }

  // -----------------------------------------------------------------------
  // Confidence
  // -----------------------------------------------------------------------

  /**
   * Confidence 0-100 based on how much enrichment data we have.
   * Pure heuristic (no external data) → ~25
   * Full data from all sources → ~85-90
   */
  private calculateConfidence(
    whoisData?: WhoisData,
    seoData?: SEOAnalysis,
    securityData?: SecurityAnalysis,
    websiteData?: WebsiteAnalysis
  ): number {
    let confidence = 25; // baseline from heuristic analysis

    if (whoisData) {
      confidence += 15;
      if (whoisData.createdDate) confidence += 5;
    }

    if (seoData) {
      confidence += 15;
      if (seoData.domainAuthority?.score && seoData.domainAuthority.score > 0) {
        confidence += 5;
      }
      if (seoData.traffic?.estimatedMonthlyVisits && seoData.traffic.estimatedMonthlyVisits > 0) {
        confidence += 5;
      }
    }

    if (securityData) {
      confidence += 10;
    }

    if (websiteData) {
      confidence += 10;
      if (websiteData.isOnline) confidence += 5;
    }

    return Math.min(100, confidence);
  }

  // -----------------------------------------------------------------------
  // Grade
  // -----------------------------------------------------------------------

  private scoreToGrade(score: number): ValuationGrade {
    // Grade thresholds account for the fact that unknown SEO/age data
    // drags the composite score down — even a perfect domain with no
    // enrichment data tops out around 75-80.
    if (score >= 78) return 'A+';
    if (score >= 68) return 'A';
    if (score >= 58) return 'B+';
    if (score >= 48) return 'B';
    if (score >= 38) return 'C+';
    if (score >= 28) return 'C';
    if (score >= 18) return 'D';
    return 'F';
  }
}

// Export singleton
export const domainValuation = new DomainValuationEngine();
