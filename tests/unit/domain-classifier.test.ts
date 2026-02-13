import { describe, it, expect } from 'vitest';
import { domainClassifier } from '@/lib/intelligence/domain-classifier';

describe('DomainClassifier', () => {
  describe('classify', () => {
    it('classifies major brands as MAJOR_BRAND', () => {
      const result = domainClassifier.classify('google.com');
      expect(result.type).toBe('MAJOR_BRAND');
      expect(result.tier).toBe(1);
      expect(result.isMajorBrand).toBe(true);
      expect(result.estimatedValue.min).toBeGreaterThanOrEqual(1_000_000_000);
    });

    it('classifies single-letter .com as PREMIUM', () => {
      const result = domainClassifier.classify('q.com');
      expect(result.type).toBe('PREMIUM');
      expect(result.tier).toBe(2);
      expect(result.estimatedValue.min).toBeGreaterThanOrEqual(1_000_000);
    });

    it('classifies two-letter .com as PREMIUM', () => {
      const result = domainClassifier.classify('ab.com');
      expect(result.type).toBe('PREMIUM');
      expect(result.estimatedValue.min).toBeGreaterThanOrEqual(100_000);
    });

    it('classifies three-letter .com as PREMIUM', () => {
      const result = domainClassifier.classify('xyz.com');
      expect(result.type).toBe('PREMIUM');
    });

    it('classifies domains with premium keywords as VALUABLE', () => {
      const result = domainClassifier.classify('clouddata.com');
      expect(result.type).toBe('VALUABLE');
      expect(result.tier).toBe(3);
    });

    it('classifies standard domains as STANDARD', () => {
      const result = domainClassifier.classify('my-random-website-name.com');
      expect(result.type).toBe('STANDARD');
      expect(result.tier).toBe(4);
    });

    it('handles case insensitivity', () => {
      const result = domainClassifier.classify('GOOGLE.COM');
      expect(result.type).toBe('MAJOR_BRAND');
    });

    it('increases value estimate for older domains', () => {
      const young = domainClassifier.classify('ab.com', 1);
      const old = domainClassifier.classify('ab.com', 15);
      expect(old.estimatedValue.min).toBeGreaterThan(young.estimatedValue.min);
    });

    it('returns valid classification structure', () => {
      const result = domainClassifier.classify('example.com');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('tier');
      expect(result).toHaveProperty('isPublicCompany');
      expect(result).toHaveProperty('isMajorBrand');
      expect(result).toHaveProperty('estimatedValue');
      expect(result).toHaveProperty('reasons');
      expect(result.estimatedValue).toHaveProperty('min');
      expect(result.estimatedValue).toHaveProperty('max');
      expect(result.estimatedValue).toHaveProperty('currency');
      expect(result.estimatedValue.currency).toBe('USD');
      expect(result.estimatedValue.max).toBeGreaterThanOrEqual(result.estimatedValue.min);
    });
  });
});
