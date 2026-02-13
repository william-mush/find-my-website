/**
 * API Key Revocation Route
 *
 * DELETE /api/keys/[id] - Revoke an API key (soft delete via revokedAt timestamp)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { id } = await params;
  const keyId = parseInt(id, 10);
  if (isNaN(keyId)) {
    return NextResponse.json(
      { error: 'Invalid key ID' },
      { status: 400 }
    );
  }

  // Find the key -- ensure it belongs to the authenticated user
  const [existingKey] = await db
    .select({ id: apiKeys.id, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, session.user.id),
      )
    )
    .limit(1);

  if (!existingKey) {
    return NextResponse.json(
      { error: 'API key not found' },
      { status: 404 }
    );
  }

  if (existingKey.revokedAt) {
    return NextResponse.json(
      { error: 'API key is already revoked' },
      { status: 400 }
    );
  }

  // Soft-delete by setting revokedAt
  await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId));

  return NextResponse.json({ success: true, message: 'API key revoked' });
}
