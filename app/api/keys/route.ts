/**
 * API Key Management Routes
 *
 * GET  /api/keys  - List the authenticated user's API keys
 * POST /api/keys  - Create a new API key (returns the full key ONCE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { generateApiKey } from '@/lib/api-keys';

/**
 * GET /api/keys
 * List all API keys for the authenticated user.
 * Returns metadata only (prefix, name, dates) -- never the full key or hash.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      rateLimit: apiKeys.rateLimit,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({ keys });
}

/**
 * POST /api/keys
 * Create a new API key. The full key is returned ONCE in the response.
 *
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  if (!name || name.length === 0) {
    return NextResponse.json(
      { error: 'API key name is required' },
      { status: 400 }
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: 'API key name must be 100 characters or fewer' },
      { status: 400 }
    );
  }

  // Limit the number of active keys per user
  const activeKeys = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, session.user.id),
        isNull(apiKeys.revokedAt),
      )
    );

  if (activeKeys.length >= 10) {
    return NextResponse.json(
      { error: 'Maximum of 10 active API keys allowed. Revoke an existing key first.' },
      { status: 400 }
    );
  }

  // Generate the key
  const { key, hash, prefix } = await generateApiKey();

  // Store in database
  const [inserted] = await db
    .insert(apiKeys)
    .values({
      userId: session.user.id,
      name,
      keyHash: hash,
      keyPrefix: prefix,
      permissions: ['domain:analyze'],
      rateLimit: 100,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      permissions: apiKeys.permissions,
      rateLimit: apiKeys.rateLimit,
      createdAt: apiKeys.createdAt,
    });

  // Return the full key ONCE
  return NextResponse.json({
    key, // Full key -- only returned at creation time
    id: inserted.id,
    name: inserted.name,
    keyPrefix: inserted.keyPrefix,
    permissions: inserted.permissions,
    rateLimit: inserted.rateLimit,
    createdAt: inserted.createdAt,
  }, { status: 201 });
}
