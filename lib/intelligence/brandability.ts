/**
 * Domain Brandability Scorer
 * Evaluates how brandable/memorable a domain name is
 */

export interface BrandabilityResult {
  score: number; // 0-100
  breakdown: {
    pronounceability: number;  // 0-25
    length: number;            // 0-20
    cleanness: number;         // 0-20 (no hyphens, no numbers)
    phonetics: number;         // 0-20 (vowel/consonant patterns)
    memorability: number;      // 0-15
  };
  flags: string[];
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const CONSONANTS = new Set([
  'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm',
  'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z',
]);

/**
 * Common pronounceable bigrams (two-letter combinations)
 * These appear frequently in English words and are easy to say
 */
const PRONOUNCEABLE_BIGRAMS = new Set([
  'th', 'he', 'in', 'er', 'an', 'en', 'on', 'at', 'es', 'ed',
  'or', 'te', 'of', 'it', 'al', 'ar', 'st', 'to', 'nt', 'is',
  'ha', 'ou', 'ng', 'se', 'me', 'le', 'no', 'ne', 'de', 'do',
  'ri', 'ro', 'co', 'ma', 'li', 'la', 'el', 'di', 'si', 'ra',
  'io', 'be', 'lo', 'ti', 'ta', 'ca', 'ce', 'ch', 'sh', 'tr',
  'pr', 'pl', 'cl', 'cr', 'br', 'bl', 'fr', 'fl', 'gr', 'gl',
  'sp', 'sk', 'sl', 'sm', 'sn', 'sw', 'dr', 'tw', 'wr', 'sc',
  'wa', 'wi', 'we', 'wo', 'un', 'up', 'us', 'ab', 'ad', 'ag',
  'am', 'ap', 'as', 'ba', 'bi', 'bo', 'bu', 'da', 'du', 'ef',
  'em', 'ev', 'ex', 'fa', 'fi', 'fo', 'fu', 'ga', 'ge', 'gi',
  'go', 'gu', 'hi', 'ho', 'hu', 'hy', 'id', 'ig', 'im', 'ir',
  'ja', 'jo', 'ju', 'ke', 'ki', 'ku', 'lu', 'mi', 'mo', 'mu',
  'na', 'ni', 'nu', 'ob', 'oc', 'od', 'og', 'ol', 'om', 'op',
  'os', 'ot', 'ov', 'ow', 'ox', 'pa', 'pe', 'pi', 'po', 'pu',
  'qu', 're', 'ru', 'sa', 'so', 'su', 'sy', 'tu', 'ul', 'um',
  'ur', 'ut', 'va', 've', 'vi', 'vo', 'vu', 'ye', 'yo', 'za',
]);

/**
 * Difficult-to-pronounce combinations
 */
const HARD_BIGRAMS = new Set([
  'bk', 'bq', 'bx', 'bz', 'cb', 'cf', 'cg', 'cj', 'cp', 'cv',
  'cw', 'cx', 'cz', 'db', 'dc', 'df', 'dg', 'dk', 'dm', 'dn',
  'dp', 'dq', 'dt', 'dv', 'dw', 'dx', 'dz', 'fb', 'fc', 'fd',
  'fg', 'fh', 'fj', 'fk', 'fm', 'fn', 'fp', 'fq', 'fv', 'fw',
  'fx', 'fz', 'gb', 'gc', 'gd', 'gf', 'gj', 'gk', 'gm', 'gn',
  'gp', 'gq', 'gt', 'gv', 'gw', 'gx', 'gz', 'hb', 'hc', 'hd',
  'hf', 'hg', 'hh', 'hj', 'hk', 'hl', 'hm', 'hn', 'hp', 'hq',
  'hr', 'hs', 'ht', 'hv', 'hw', 'hx', 'hz', 'jb', 'jc', 'jd',
  'jf', 'jg', 'jh', 'jj', 'jk', 'jl', 'jm', 'jn', 'jp', 'jq',
  'jr', 'js', 'jt', 'jv', 'jw', 'jx', 'jz', 'kb', 'kc', 'kd',
  'kf', 'kg', 'kh', 'kj', 'kk', 'km', 'kp', 'kq', 'kt', 'kv',
  'kw', 'kx', 'kz', 'lk', 'lq', 'lx', 'lz', 'mj', 'mk', 'mq',
  'mv', 'mx', 'mz', 'nj', 'nq', 'nx', 'nz', 'pb', 'pc', 'pd',
  'pf', 'pg', 'pj', 'pk', 'pm', 'pn', 'pq', 'pv', 'pw', 'px',
  'pz', 'qa', 'qb', 'qc', 'qd', 'qe', 'qf', 'qg', 'qh', 'qi',
  'qj', 'qk', 'ql', 'qm', 'qn', 'qo', 'qp', 'qq', 'qr', 'qs',
  'qt', 'qv', 'qw', 'qx', 'qy', 'qz', 'rj', 'rq', 'rx', 'rz',
  'sb', 'sd', 'sf', 'sg', 'sj', 'sq', 'sr', 'sv', 'sx', 'sz',
  'tb', 'tc', 'td', 'tf', 'tg', 'tj', 'tk', 'tm', 'tn', 'tp',
  'tq', 'tv', 'tx', 'tz', 'vb', 'vc', 'vd', 'vf', 'vg', 'vh',
  'vj', 'vk', 'vl', 'vm', 'vn', 'vp', 'vq', 'vr', 'vs', 'vt',
  'vv', 'vw', 'vx', 'vz', 'wb', 'wc', 'wd', 'wf', 'wg', 'wj',
  'wk', 'wl', 'wm', 'wn', 'wp', 'wq', 'wt', 'wv', 'ww', 'wx',
  'wz', 'xb', 'xc', 'xd', 'xf', 'xg', 'xh', 'xj', 'xk', 'xl',
  'xm', 'xn', 'xo', 'xp', 'xq', 'xr', 'xs', 'xt', 'xv', 'xw',
  'xx', 'xz', 'yb', 'yc', 'yd', 'yf', 'yg', 'yh', 'yj', 'yk',
  'yl', 'ym', 'yn', 'yp', 'yq', 'yr', 'yt', 'yv', 'yw', 'yx',
  'yy', 'yz', 'zb', 'zc', 'zd', 'zf', 'zg', 'zh', 'zj', 'zk',
  'zl', 'zm', 'zn', 'zp', 'zq', 'zr', 'zs', 'zt', 'zv', 'zw',
  'zx', 'zz',
]);

/**
 * Check if a string is pronounceable
 * Returns a score from 0-100 indicating pronounceability
 */
export function isPronounceable(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length === 0) return 0;
  if (clean.length === 1) return 80; // single letters are pronounceable
  if (clean.length === 2) return 70; // most two-letter combos are fine

  let pronounceableCount = 0;
  let hardCount = 0;
  let totalBigrams = 0;

  for (let i = 0; i < clean.length - 1; i++) {
    const bigram = clean.substring(i, i + 2);
    totalBigrams++;

    if (PRONOUNCEABLE_BIGRAMS.has(bigram)) {
      pronounceableCount++;
    }
    if (HARD_BIGRAMS.has(bigram)) {
      hardCount++;
    }
  }

  if (totalBigrams === 0) return 50;

  // Check for consonant clusters (3+ consonants in a row)
  const consonantClusters = clean.match(/[bcdfghjklmnpqrstvwxyz]{4,}/gi);
  const clusterPenalty = consonantClusters ? consonantClusters.length * 20 : 0;

  // Check for vowel presence
  const vowelCount = clean.split('').filter((c) => VOWELS.has(c)).length;
  const vowelRatio = vowelCount / clean.length;
  // Ideal vowel ratio is 0.3-0.5
  const vowelBonus = vowelRatio >= 0.25 && vowelRatio <= 0.55 ? 10 : 0;

  const pronounceableRatio = pronounceableCount / totalBigrams;
  const hardRatio = hardCount / totalBigrams;

  let score = 50; // baseline
  score += pronounceableRatio * 40;  // up to +40 for all pronounceable bigrams
  score -= hardRatio * 50;           // up to -50 for all hard bigrams
  score -= clusterPenalty;
  score += vowelBonus;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Score the brandability of a domain name
 */
export function scoreBrandability(domain: string): BrandabilityResult {
  const parts = domain.toLowerCase().split('.');
  const name = parts[0];
  const flags: string[] = [];

  // 1. Pronounceability score (0-25)
  const pronounceabilityRaw = isPronounceable(name);
  const pronounceability = Math.round((pronounceabilityRaw / 100) * 25);

  if (pronounceabilityRaw >= 70) {
    flags.push('Highly pronounceable');
  } else if (pronounceabilityRaw < 40) {
    flags.push('Difficult to pronounce');
  }

  // 2. Length score (0-20)
  let lengthScore: number;
  const nameLen = name.replace(/-/g, '').length;
  if (nameLen <= 4) lengthScore = 20;
  else if (nameLen <= 6) lengthScore = 18;
  else if (nameLen <= 8) lengthScore = 14;
  else if (nameLen <= 10) lengthScore = 10;
  else if (nameLen <= 13) lengthScore = 6;
  else if (nameLen <= 16) lengthScore = 3;
  else lengthScore = 1;

  if (nameLen <= 5) {
    flags.push('Short and memorable');
  } else if (nameLen > 15) {
    flags.push('Too long for easy branding');
  }

  // 3. Cleanness score (0-20) - no hyphens, no numbers
  let cleanness = 20;
  const hasHyphens = name.includes('-');
  const hasNumbers = /\d/.test(name);
  const hasDoubleHyphens = name.includes('--');

  if (hasHyphens) {
    const hyphenCount = (name.match(/-/g) || []).length;
    cleanness -= Math.min(12, hyphenCount * 6);
    flags.push(`Contains ${hyphenCount} hyphen${hyphenCount > 1 ? 's' : ''}`);
  }
  if (hasNumbers) {
    cleanness -= 6;
    flags.push('Contains numbers');
  }
  if (hasDoubleHyphens) {
    cleanness -= 4;
    flags.push('Contains double hyphens');
  }
  cleanness = Math.max(0, cleanness);

  // 4. Phonetic quality (0-20)
  let phonetics = 10; // baseline

  // Check vowel/consonant ratio
  const letters = name.replace(/[^a-z]/gi, '').toLowerCase();
  const vowelCount = letters.split('').filter((c) => VOWELS.has(c)).length;
  const consonantCount = letters.split('').filter((c) => CONSONANTS.has(c)).length;

  if (letters.length > 0) {
    const ratio = vowelCount / letters.length;
    // Ideal ratio is 0.3-0.45 (like most English words)
    if (ratio >= 0.28 && ratio <= 0.50) {
      phonetics += 6;
      flags.push('Good vowel/consonant balance');
    } else if (ratio < 0.15) {
      phonetics -= 6;
      flags.push('Too few vowels');
    } else if (ratio > 0.65) {
      phonetics -= 4;
      flags.push('Too many vowels');
    }
  }

  // Check for repeating characters
  const repeats = name.match(/(.)\1{2,}/);
  if (repeats) {
    phonetics -= 4;
    flags.push('Has repeating characters');
  }

  // Check if it ends with a common suffix (makes it feel like a real word)
  const commonSuffixes = ['ly', 'er', 'le', 'ify', 'ful', 'ous', 'ive', 'tion', 'ment', 'able', 'ible', 'ity', 'ness'];
  const endsWithSuffix = commonSuffixes.some((s) => name.endsWith(s));
  if (endsWithSuffix && !hasHyphens) {
    phonetics += 4;
    flags.push('Natural word ending');
  }

  phonetics = Math.max(0, Math.min(20, phonetics));

  // 5. Memorability (0-15)
  let memorability = 8; // baseline

  // Short and clean = memorable
  if (nameLen <= 6 && !hasHyphens && !hasNumbers) {
    memorability += 5;
  }

  // One syllable estimate (very rough)
  const estimatedSyllables = estimateSyllableCount(name);
  if (estimatedSyllables <= 2) {
    memorability += 2;
    flags.push('Easy to remember (short syllable count)');
  } else if (estimatedSyllables >= 5) {
    memorability -= 3;
    flags.push('Many syllables reduce memorability');
  }

  memorability = Math.max(0, Math.min(15, memorability));

  const totalScore = pronounceability + lengthScore + cleanness + phonetics + memorability;

  return {
    score: Math.min(100, totalScore),
    breakdown: {
      pronounceability,
      length: lengthScore,
      cleanness,
      phonetics,
      memorability,
    },
    flags,
  };
}

/**
 * Estimate syllable count (rough heuristic)
 */
function estimateSyllableCount(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 2) return 1;

  let count = 0;
  let prevVowel = false;

  for (const char of clean) {
    const isVowel = VOWELS.has(char);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Handle silent e
  if (clean.endsWith('e') && count > 1) {
    count--;
  }

  return Math.max(1, count);
}
