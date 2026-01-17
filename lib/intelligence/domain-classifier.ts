/**
 * Intelligent Domain Classification
 * Detects major brands, premium domains, and provides accurate valuation
 */

export interface DomainClassification {
  type: 'MAJOR_BRAND' | 'PREMIUM' | 'VALUABLE' | 'STANDARD' | 'LOW_VALUE';
  tier: 1 | 2 | 3 | 4 | 5; // 1 = Fortune 100, 5 = Standard
  isPublicCompany: boolean;
  isMajorBrand: boolean;
  estimatedValue: {
    min: number;
    max: number;
    currency: string;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  reasons: string[];
}

export class DomainClassifier {
  // Fortune 500 / Major Tech Companies
  private majorBrands = new Set([
    // Tech Giants (Trillion dollar companies)
    'google.com', 'apple.com', 'microsoft.com', 'amazon.com', 'meta.com', 'facebook.com',
    'tesla.com', 'nvidia.com', 'alphabet.com', 'netflix.com', 'adobe.com', 'salesforce.com',
    'oracle.com', 'ibm.com', 'intel.com', 'cisco.com', 'qualcomm.com', 'broadcom.com',

    // Social Media / Platforms
    'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'tiktok.com', 'snapchat.com',
    'reddit.com', 'pinterest.com', 'youtube.com', 'twitch.tv', 'discord.com', 'telegram.org',

    // E-commerce
    'ebay.com', 'walmart.com', 'target.com', 'alibaba.com', 'shopify.com', 'etsy.com',

    // Finance
    'visa.com', 'mastercard.com', 'paypal.com', 'stripe.com', 'jpmorgan.com', 'bankofamerica.com',
    'wellsfargo.com', 'goldmansachs.com', 'morganstanley.com', 'amex.com',

    // Media / Entertainment
    'disney.com', 'warnerbros.com', 'paramount.com', 'nbc.com', 'cbs.com', 'fox.com',
    'espn.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com', 'reuters.com', 'bloomberg.com',

    // Travel / Hospitality
    'booking.com', 'airbnb.com', 'expedia.com', 'marriott.com', 'hilton.com', 'uber.com',

    // Other Major Brands
    'nike.com', 'adidas.com', 'coca-cola.com', 'pepsi.com', 'mcdonalds.com', 'starbucks.com',
  ]);

  // Premium single/double letter domains
  private premiumPatterns = [
    /^[a-z]\.com$/,           // a.com, b.com, etc.
    /^[a-z]{2}\.com$/,        // ab.com, xy.com, etc.
    /^[a-z]{3}\.com$/,        // xyz.com, etc. (3-letter .com)
  ];

  // High-value dictionary words
  private premiumKeywords = new Set([
    'ai', 'crypto', 'nft', 'web3', 'bitcoin', 'ethereum', 'blockchain',
    'cloud', 'data', 'app', 'mobile', 'tech', 'digital', 'online',
    'shop', 'store', 'market', 'pay', 'bank', 'finance', 'money',
    'real', 'estate', 'property', 'invest', 'trade', 'stock',
    'health', 'medical', 'fitness', 'insurance', 'travel', 'hotel',
    'news', 'media', 'video', 'music', 'game', 'sport',
    'food', 'restaurant', 'delivery', 'car', 'auto', 'drive',
  ]);

  /**
   * Classify a domain's value and type
   */
  classify(
    domain: string,
    domainAge?: number,
    traffic?: number,
    backlinks?: number
  ): DomainClassification {
    const cleanDomain = domain.toLowerCase().trim();

    // Check if major brand
    if (this.majorBrands.has(cleanDomain)) {
      return this.classifyMajorBrand(cleanDomain);
    }

    // Check if premium pattern (short domain, etc.)
    if (this.isPremiumPattern(cleanDomain)) {
      return this.classifyPremium(cleanDomain, domainAge);
    }

    // Check if contains premium keywords
    if (this.hasPremiumKeywords(cleanDomain)) {
      return this.classifyValuable(cleanDomain, domainAge, traffic, backlinks);
    }

    // Standard domain
    return this.classifyStandard(cleanDomain, domainAge, traffic, backlinks);
  }

  /**
   * Major brand classification
   */
  private classifyMajorBrand(domain: string): DomainClassification {
    return {
      type: 'MAJOR_BRAND',
      tier: 1,
      isPublicCompany: true,
      isMajorBrand: true,
      estimatedValue: {
        min: 1000000000, // $1 billion+
        max: 10000000000, // $10 billion+
        currency: 'USD',
        confidence: 'HIGH',
      },
      reasons: [
        'Fortune 500 / Major global brand',
        'Domain tied to multi-billion dollar company',
        'Impossible to acquire through normal means',
        'Protected by extensive trademark and legal resources',
      ],
    };
  }

  /**
   * Premium domain classification (short, rare)
   */
  private classifyPremium(domain: string, domainAge?: number): DomainClassification {
    const parts = domain.split('.');
    const name = parts[0];
    const tld = parts[1];

    let min = 10000;
    let max = 100000;

    // Single letter .com
    if (name.length === 1 && tld === 'com') {
      min = 1000000;
      max = 10000000;
    }
    // Two letter .com
    else if (name.length === 2 && tld === 'com') {
      min = 100000;
      max = 1000000;
    }
    // Three letter .com
    else if (name.length === 3 && tld === 'com') {
      min = 10000;
      max = 100000;
    }

    // Age bonus
    if (domainAge && domainAge > 10) {
      min *= 1.5;
      max *= 1.5;
    }

    return {
      type: 'PREMIUM',
      tier: 2,
      isPublicCompany: false,
      isMajorBrand: false,
      estimatedValue: {
        min: Math.round(min),
        max: Math.round(max),
        currency: 'USD',
        confidence: 'HIGH',
      },
      reasons: [
        `Ultra-short domain (${name.length} characters)`,
        'Highly sought after by investors and businesses',
        'Limited supply makes these extremely valuable',
        tld === 'com' ? 'Premium .com TLD' : `TLD: .${tld}`,
      ],
    };
  }

  /**
   * Valuable domain classification (keywords, traffic)
   */
  private classifyValuable(
    domain: string,
    domainAge?: number,
    traffic?: number,
    backlinks?: number
  ): DomainClassification {
    let min = 1000;
    let max = 50000;

    const parts = domain.split('.');
    const tld = parts[1];

    // TLD multiplier
    if (tld === 'com') {
      min *= 2;
      max *= 2;
    }

    // Age multiplier
    if (domainAge) {
      if (domainAge > 15) {
        min *= 2;
        max *= 2;
      } else if (domainAge > 10) {
        min *= 1.5;
        max *= 1.5;
      } else if (domainAge > 5) {
        min *= 1.2;
        max *= 1.2;
      }
    }

    // Traffic multiplier
    if (traffic) {
      if (traffic > 100000) {
        min *= 5;
        max *= 10;
      } else if (traffic > 10000) {
        min *= 2;
        max *= 3;
      }
    }

    // Backlinks multiplier
    if (backlinks && backlinks > 1000) {
      min *= 1.5;
      max *= 2;
    }

    const reasons = ['Contains premium keywords'];
    if (tld === 'com') reasons.push('Valuable .com extension');
    if (domainAge && domainAge > 10) reasons.push(`Mature domain (${domainAge} years old)`);
    if (traffic && traffic > 10000) reasons.push(`Significant traffic (${traffic.toLocaleString()}/month)`);

    return {
      type: 'VALUABLE',
      tier: 3,
      isPublicCompany: false,
      isMajorBrand: false,
      estimatedValue: {
        min: Math.round(min),
        max: Math.round(max),
        currency: 'USD',
        confidence: 'MEDIUM',
      },
      reasons,
    };
  }

  /**
   * Standard domain classification
   */
  private classifyStandard(
    domain: string,
    domainAge?: number,
    traffic?: number,
    backlinks?: number
  ): DomainClassification {
    let min = 100;
    let max = 5000;

    const parts = domain.split('.');
    const name = parts[0];
    const tld = parts[1];

    // Length penalty
    if (name.length > 15) {
      min /= 2;
      max /= 2;
    }

    // TLD adjustment
    if (tld === 'com') {
      min *= 2;
      max *= 2;
    } else if (['net', 'org'].includes(tld)) {
      min *= 1.2;
      max *= 1.2;
    }

    // Age bonus
    if (domainAge && domainAge > 5) {
      min *= 1.5;
      max *= 1.5;
    }

    // Traffic bonus
    if (traffic && traffic > 1000) {
      min *= 2;
      max *= 3;
    }

    const reasons = [`${name.length}-character domain`];
    if (tld === 'com') reasons.push('.com extension adds value');
    if (domainAge && domainAge > 5) reasons.push(`Established domain (${domainAge} years)`);

    return {
      type: domainAge && domainAge < 1 ? 'LOW_VALUE' : 'STANDARD',
      tier: 4,
      isPublicCompany: false,
      isMajorBrand: false,
      estimatedValue: {
        min: Math.round(min),
        max: Math.round(max),
        currency: 'USD',
        confidence: 'MEDIUM',
      },
      reasons,
    };
  }

  /**
   * Check if domain matches premium pattern
   */
  private isPremiumPattern(domain: string): boolean {
    return this.premiumPatterns.some(pattern => pattern.test(domain));
  }

  /**
   * Check if domain contains premium keywords
   */
  private hasPremiumKeywords(domain: string): boolean {
    const name = domain.split('.')[0].toLowerCase();

    // Check exact matches
    if (this.premiumKeywords.has(name)) return true;

    // Check if contains premium keyword
    return Array.from(this.premiumKeywords).some(keyword => name.includes(keyword));
  }
}

export const domainClassifier = new DomainClassifier();
