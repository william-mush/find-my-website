/**
 * API Key Management Utilities
 *
 * Generates, validates, and manages API keys for programmatic access.
 * Keys follow the format: fmw_live_<32 random hex chars>
 * Only the bcrypt hash is stored; the full key is shown once at creation.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';

const KEY_PREFIX = 'fmw_live_';
const BCRYPT_ROUNDS = 10;

export interface GeneratedKey {
  key: string;      // Full key (shown once)
  hash: string;     // bcrypt hash (stored in DB)
  prefix: string;   // First 8 chars of the random part for display
}

export interface ValidatedApiKey {
  userId: string;
  keyId: number;
  permissions: string[];
  rateLimit: number;
}

/**
 * Generate a new API key.
 * Returns the full key (to show once), its bcrypt hash, and a display prefix.
 */
export async function generateApiKey(): Promise<GeneratedKey> {
  const randomPart = crypto.randomBytes(24).toString('hex'); // 48 hex chars
  const key = `${KEY_PREFIX}${randomPart}`;
  const hash = await bcrypt.hash(key, BCRYPT_ROUNDS);
  const prefix = `${KEY_PREFIX}${randomPart.substring(0, 8)}`;

  return { key, hash, prefix };
}

/**
 * Validate an API key from a request.
 * Looks up candidate keys by prefix, verifies the bcrypt hash,
 * checks expiry and revocation, then updates lastUsedAt.
 *
 * Returns the validated key info or null if invalid.
 */
export async function validateApiKey(key: string): Promise<ValidatedApiKey | null> {
  // Check format
  if (!key.startsWith(KEY_PREFIX)) {
    return null;
  }

  const randomPart = key.slice(KEY_PREFIX.length);
  if (randomPart.length < 8) {
    return null;
  }

  // Build prefix for lookup
  const prefix = `${KEY_PREFIX}${randomPart.substring(0, 8)}`;

  // Find candidate keys by prefix that are not revoked
  const candidates = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyPrefix, prefix),
        isNull(apiKeys.revokedAt),
      )
    );

  if (candidates.length === 0) {
    return null;
  }

  // Verify the bcrypt hash against each candidate
  for (const candidate of candidates) {
    const isMatch = await bcrypt.compare(key, candidate.keyHash);
    if (isMatch) {
      // Check expiration
      if (candidate.expiresAt && new Date() > candidate.expiresAt) {
        return null;
      }

      // Update lastUsedAt (fire-and-forget)
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, candidate.id))
        .catch((err) => {
          console.error('[API Keys] Failed to update lastUsedAt:', err);
        });

      return {
        userId: candidate.userId,
        keyId: candidate.id,
        permissions: (candidate.permissions as string[]) || ['domain:analyze'],
        rateLimit: candidate.rateLimit || 100,
      };
    }
  }

  return null;
}

/**
 * Middleware-style function to authenticate a request via API key.
 * Checks the Authorization header for a Bearer token with fmw_live_ prefix.
 * Returns the validated key info or null.
 */
export async function authenticateApiKey(request: NextRequest): Promise<ValidatedApiKey | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  // Support "Bearer fmw_live_..." format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1];
  if (!token.startsWith(KEY_PREFIX)) {
    return null;
  }

  return validateApiKey(token);
}
