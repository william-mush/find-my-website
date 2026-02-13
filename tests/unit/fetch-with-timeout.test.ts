import { describe, it, expect, vi } from 'vitest';
import { withTimeout } from '@/lib/utils/fetch-with-timeout';

describe('withTimeout', () => {
  it('resolves when promise completes before timeout', async () => {
    const result = await withTimeout(
      Promise.resolve('success'),
      1000
    );
    expect(result).toBe('success');
  });

  it('rejects when promise exceeds timeout', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('too late'), 500);
    });

    await expect(withTimeout(slowPromise, 50)).rejects.toThrow('timeout');
  });

  it('returns fallback when timeout and fallback provided', async () => {
    const slowPromise = new Promise((resolve) => {
      setTimeout(() => resolve('too late'), 500);
    });

    const result = await withTimeout(slowPromise, 50, 'fallback-value');
    expect(result).toBe('fallback-value');
  });

  it('does not use fallback when promise resolves in time', async () => {
    const result = await withTimeout(
      Promise.resolve('actual'),
      1000,
      'fallback'
    );
    expect(result).toBe('actual');
  });

  it('propagates errors from the promise', async () => {
    await expect(
      withTimeout(Promise.reject(new Error('test error')), 1000)
    ).rejects.toThrow('test error');
  });
});
