/**
 * Domain Comparable Sales Database
 * Static dataset of notable domain sales for valuation comparisons
 */

export interface ComparableSale {
  domain: string;
  salePrice: number;
  date: string;
  category: string;
  length: number;
  tld: string;
  hasHyphens: boolean;
  hasNumbers: boolean;
  isOneWord: boolean;
}

/**
 * Notable domain sales dataset
 * Sources: DNJournal, NameBio, public reports
 */
const COMPARABLE_SALES: ComparableSale[] = [
  // Ultra-premium single-word .com domains
  { domain: 'voice.com', salePrice: 30_000_000, date: '2019-06-01', category: 'technology', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'insurance.com', salePrice: 35_600_000, date: '2010-10-01', category: 'finance', length: 9, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'hotels.com', salePrice: 11_000_000, date: '2001-12-01', category: 'travel', length: 6, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'fund.com', salePrice: 9_999_950, date: '2008-03-01', category: 'finance', length: 4, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'sex.com', salePrice: 13_000_000, date: '2010-11-01', category: 'adult', length: 3, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'toys.com', salePrice: 5_100_000, date: '2009-02-01', category: 'retail', length: 4, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'candy.com', salePrice: 3_000_000, date: '2014-06-01', category: 'retail', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'crypto.com', salePrice: 12_000_000, date: '2018-07-01', category: 'technology', length: 6, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'cloud.com', salePrice: 3_250_000, date: '2016-08-01', category: 'technology', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'korea.com', salePrice: 5_000_000, date: '2000-01-01', category: 'geo', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },

  // Premium short .com domains (2-3 letters)
  { domain: 'fb.com', salePrice: 8_500_000, date: '2010-11-01', category: 'technology', length: 2, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'ig.com', salePrice: 4_700_000, date: '2016-09-01', category: 'technology', length: 2, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'hg.com', salePrice: 3_770_000, date: '2017-06-01', category: 'generic', length: 2, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'we.com', salePrice: 8_000_000, date: '2015-05-01', category: 'generic', length: 2, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'ai.com', salePrice: 4_500_000, date: '2018-01-01', category: 'technology', length: 2, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'nft.com', salePrice: 15_000_000, date: '2022-04-01', category: 'technology', length: 3, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'eth.com', salePrice: 2_000_000, date: '2017-09-01', category: 'technology', length: 3, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'car.com', salePrice: 872_000, date: '2015-10-01', category: 'auto', length: 3, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },

  // Two-word .com domains
  { domain: 'creditcards.com', salePrice: 2_750_000, date: '2004-01-01', category: 'finance', length: 11, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },
  { domain: 'webhosting.com', salePrice: 495_000, date: '2013-04-01', category: 'technology', length: 10, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },
  { domain: 'realestate.com', salePrice: 3_000_000, date: '2005-03-01', category: 'real-estate', length: 10, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },
  { domain: 'onlinegambling.com', salePrice: 500_000, date: '2013-09-01', category: 'gambling', length: 15, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },
  { domain: 'healthinsurance.com', salePrice: 2_000_000, date: '2008-03-01', category: 'finance', length: 15, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },
  { domain: 'cheapflights.com', salePrice: 1_800_000, date: '2007-06-01', category: 'travel', length: 12, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },
  { domain: 'privatejet.com', salePrice: 30_100_000, date: '2012-02-01', category: 'travel', length: 10, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },
  { domain: 'autoinsurance.com', salePrice: 49_700_000, date: '2010-11-01', category: 'finance', length: 13, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: false },

  // Medium-value .com domains (4-6 letter single words)
  { domain: 'beer.com', salePrice: 7_000_000, date: '2004-02-01', category: 'food-drink', length: 4, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'fish.com', salePrice: 1_020_000, date: '2016-01-01', category: 'food-drink', length: 4, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'park.com', salePrice: 485_000, date: '2017-04-01', category: 'generic', length: 4, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'taxi.com', salePrice: 950_000, date: '2015-08-01', category: 'transport', length: 4, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'color.com', salePrice: 200_000, date: '2015-05-01', category: 'generic', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'nurse.com', salePrice: 500_000, date: '2018-03-01', category: 'health', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'clean.com', salePrice: 300_000, date: '2019-07-01', category: 'generic', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'ocean.com', salePrice: 310_000, date: '2019-02-01', category: 'generic', length: 5, tld: 'com', hasHyphens: false, hasNumbers: false, isOneWord: true },

  // .io domains (tech-focused)
  { domain: 'data.io', salePrice: 75_000, date: '2018-11-01', category: 'technology', length: 4, tld: 'io', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'api.io', salePrice: 50_000, date: '2019-05-01', category: 'technology', length: 3, tld: 'io', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'cloud.io', salePrice: 40_000, date: '2019-08-01', category: 'technology', length: 5, tld: 'io', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'app.io', salePrice: 35_000, date: '2020-02-01', category: 'technology', length: 3, tld: 'io', hasHyphens: false, hasNumbers: false, isOneWord: true },

  // .ai domains
  { domain: 'chat.ai', salePrice: 100_000, date: '2023-02-01', category: 'technology', length: 4, tld: 'ai', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'code.ai', salePrice: 60_000, date: '2023-06-01', category: 'technology', length: 4, tld: 'ai', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'trade.ai', salePrice: 30_000, date: '2023-03-01', category: 'finance', length: 5, tld: 'ai', hasHyphens: false, hasNumbers: false, isOneWord: true },

  // .net and .org domains
  { domain: 'diet.net', salePrice: 200_000, date: '2014-05-01', category: 'health', length: 4, tld: 'net', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'poker.net', salePrice: 75_000, date: '2016-12-01', category: 'gambling', length: 5, tld: 'net', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'phone.org', salePrice: 60_000, date: '2017-01-01', category: 'technology', length: 5, tld: 'org', hasHyphens: false, hasNumbers: false, isOneWord: true },

  // Lower-value domains (longer, hyphenated, niche)
  { domain: 'best-online-poker.com', salePrice: 15_000, date: '2018-08-01', category: 'gambling', length: 16, tld: 'com', hasHyphens: true, hasNumbers: false, isOneWord: false },
  { domain: 'my-travel-guide.com', salePrice: 5_000, date: '2019-04-01', category: 'travel', length: 14, tld: 'com', hasHyphens: true, hasNumbers: false, isOneWord: false },
  { domain: 'online-shop-24.com', salePrice: 2_500, date: '2020-03-01', category: 'retail', length: 14, tld: 'com', hasHyphens: true, hasNumbers: true, isOneWord: false },
  { domain: 'best-vpn-service.net', salePrice: 3_000, date: '2020-06-01', category: 'technology', length: 15, tld: 'net', hasHyphens: true, hasNumbers: false, isOneWord: false },
  { domain: 'cheap-flights-online.com', salePrice: 8_000, date: '2019-11-01', category: 'travel', length: 20, tld: 'com', hasHyphens: true, hasNumbers: false, isOneWord: false },

  // Domains with numbers
  { domain: '360.com', salePrice: 17_000_000, date: '2015-02-01', category: 'technology', length: 3, tld: 'com', hasHyphens: false, hasNumbers: true, isOneWord: true },
  { domain: '114.com', salePrice: 2_100_000, date: '2013-12-01', category: 'generic', length: 3, tld: 'com', hasHyphens: false, hasNumbers: true, isOneWord: true },
  { domain: 'win365.com', salePrice: 45_000, date: '2019-09-01', category: 'technology', length: 6, tld: 'com', hasHyphens: false, hasNumbers: true, isOneWord: false },
  { domain: 'shop24.com', salePrice: 25_000, date: '2020-01-01', category: 'retail', length: 6, tld: 'com', hasHyphens: false, hasNumbers: true, isOneWord: false },

  // Country code TLDs
  { domain: 'game.co', salePrice: 55_000, date: '2018-07-01', category: 'entertainment', length: 4, tld: 'co', hasHyphens: false, hasNumbers: false, isOneWord: true },
  { domain: 'tech.co', salePrice: 45_000, date: '2017-10-01', category: 'technology', length: 4, tld: 'co', hasHyphens: false, hasNumbers: false, isOneWord: true },
];

/**
 * Domain categories used for matching
 */
const KEYWORD_CATEGORIES: Record<string, string[]> = {
  technology: ['tech', 'code', 'data', 'cloud', 'app', 'web', 'api', 'cyber', 'digital', 'soft', 'dev', 'ai', 'ml', 'crypto', 'nft', 'blockchain'],
  finance: ['bank', 'pay', 'money', 'fund', 'invest', 'credit', 'loan', 'insurance', 'trade', 'stock', 'finance', 'wealth'],
  health: ['health', 'medical', 'doctor', 'nurse', 'fitness', 'diet', 'pharma', 'care', 'therapy', 'dental'],
  travel: ['travel', 'hotel', 'flight', 'trip', 'tour', 'vacation', 'booking', 'cruise', 'resort'],
  retail: ['shop', 'store', 'buy', 'sell', 'deal', 'market', 'retail', 'mall', 'outlet'],
  'real-estate': ['house', 'home', 'property', 'real', 'estate', 'rent', 'land', 'apartment'],
  'food-drink': ['food', 'restaurant', 'pizza', 'coffee', 'beer', 'wine', 'cook', 'eat', 'recipe', 'cafe'],
  auto: ['car', 'auto', 'motor', 'vehicle', 'drive', 'truck', 'tire'],
  entertainment: ['game', 'play', 'music', 'movie', 'sport', 'fun', 'video', 'media'],
  generic: ['best', 'top', 'pro', 'go', 'get', 'my', 'the', 'one', 'all'],
};

/**
 * Find comparable sales for a given domain
 */
export function findComparableSales(
  domain: string,
  maxResults: number = 5
): Array<ComparableSale & { similarity: number }> {
  const parts = domain.toLowerCase().split('.');
  const name = parts[0];
  const tld = parts.slice(1).join('.');
  const length = name.length;
  const hasHyphens = name.includes('-');
  const hasNumbers = /\d/.test(name);

  // Detect the category of the input domain
  const domainCategory = detectCategory(name);

  // Score each comparable sale based on similarity
  const scored = COMPARABLE_SALES.map((sale) => {
    let similarity = 0;

    // TLD match (strong signal)
    if (sale.tld === tld) {
      similarity += 30;
    } else if (
      (tld === 'com' && ['net', 'org'].includes(sale.tld)) ||
      (['net', 'org'].includes(tld) && sale.tld === 'com')
    ) {
      similarity += 10;
    }

    // Length similarity (closer = better)
    const lengthDiff = Math.abs(sale.length - length);
    if (lengthDiff === 0) similarity += 25;
    else if (lengthDiff <= 1) similarity += 20;
    else if (lengthDiff <= 2) similarity += 15;
    else if (lengthDiff <= 4) similarity += 8;
    else similarity += Math.max(0, 5 - lengthDiff);

    // Hyphen match
    if (sale.hasHyphens === hasHyphens) similarity += 10;

    // Number match
    if (sale.hasNumbers === hasNumbers) similarity += 5;

    // Category match
    if (domainCategory && sale.category === domainCategory) {
      similarity += 20;
    }

    // One-word match
    const isOneWord = !hasHyphens && !name.match(/[A-Z]/);
    if (sale.isOneWord === isOneWord) similarity += 10;

    // Normalize to 0-100
    similarity = Math.min(100, similarity);

    return { ...sale, similarity };
  });

  // Sort by similarity (descending), then by date (most recent first)
  scored.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return scored.slice(0, maxResults);
}

/**
 * Detect the likely category of a domain name
 */
function detectCategory(name: string): string | null {
  const cleanName = name.replace(/-/g, '').toLowerCase();

  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    for (const keyword of keywords) {
      if (cleanName.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Get the median sale price for domains with similar characteristics
 */
export function getMedianPrice(
  tld: string,
  length: number,
  hasHyphens: boolean = false
): number {
  const similar = COMPARABLE_SALES.filter((sale) => {
    const tldMatch = sale.tld === tld;
    const lengthClose = Math.abs(sale.length - length) <= 2;
    const hyphenMatch = sale.hasHyphens === hasHyphens;
    return tldMatch && lengthClose && hyphenMatch;
  });

  if (similar.length === 0) {
    // Fallback: just match by TLD
    const tldMatches = COMPARABLE_SALES.filter((s) => s.tld === tld);
    if (tldMatches.length === 0) return 1000; // absolute fallback
    const prices = tldMatches.map((s) => s.salePrice).sort((a, b) => a - b);
    return prices[Math.floor(prices.length / 2)];
  }

  const prices = similar.map((s) => s.salePrice).sort((a, b) => a - b);
  return prices[Math.floor(prices.length / 2)];
}

/**
 * Get all sales in the database
 */
export function getAllSales(): ComparableSale[] {
  return [...COMPARABLE_SALES];
}
