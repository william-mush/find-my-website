import { describe, it, expect } from 'vitest';
import { seoAPI } from '@/lib/external-apis/seo';

describe('SEOAPI', () => {
  describe('analyze', () => {
    it('returns max authority for major brands', async () => {
      const result = await seoAPI.analyze('google.com', undefined, {
        domain: 'google.com',
        createdDate: new Date('1997-09-15'),
        privacy: { isPrivate: false },
        locks: { transferLocked: true, updateLocked: false, deleteLocked: false },
        transferInfo: { isEligible: false, authCodeRequired: true },
      });

      expect(result.domainAuthority.score).toBe(100);
      expect(result.domain).toBe('google.com');
    });

    it('returns valid structure for any domain', async () => {
      const result = await seoAPI.analyze('example.com');

      expect(result).toHaveProperty('domain');
      expect(result).toHaveProperty('domainAuthority');
      expect(result).toHaveProperty('backlinks');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('traffic');
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('seoHealth');
      expect(result).toHaveProperty('timestamp');
      expect(result.domainAuthority.score).toBeGreaterThanOrEqual(0);
      expect(result.domainAuthority.score).toBeLessThanOrEqual(100);
    });

    it('strips protocol and trailing slash from domain', async () => {
      const result = await seoAPI.analyze('https://example.com/');
      expect(result.domain).toBe('example.com');
    });

    it('increases authority for older domains', async () => {
      const young = await seoAPI.analyze('newsite.com');
      const old = await seoAPI.analyze('oldsite.com', undefined, {
        domain: 'oldsite.com',
        createdDate: new Date('2000-01-01'),
        privacy: { isPrivate: false },
        locks: { transferLocked: false, updateLocked: false, deleteLocked: false },
        transferInfo: { isEligible: true, authCodeRequired: true },
      });

      expect(old.domainAuthority.score).toBeGreaterThan(young.domainAuthority.score);
    });
  });
});
