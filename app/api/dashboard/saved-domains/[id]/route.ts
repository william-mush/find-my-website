import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { savedDomains } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/dashboard/saved-domains/[id] - Update notes/tags
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const domainId = parseInt(id, 10);

    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { notes, tags } = body;

    // Verify ownership
    const existing = await db
      .select()
      .from(savedDomains)
      .where(
        and(
          eq(savedDomains.id, domainId),
          eq(savedDomains.userId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : [];
    }

    const [updated] = await db
      .update(savedDomains)
      .set(updateData)
      .where(
        and(
          eq(savedDomains.id, domainId),
          eq(savedDomains.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json({ domain: updated });
  } catch (error) {
    console.error('Failed to update saved domain:', error);
    return NextResponse.json(
      { error: 'Failed to update saved domain' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/saved-domains/[id] - Remove saved domain
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const domainId = parseInt(id, 10);

    if (isNaN(domainId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify ownership and delete
    const deleted = await db
      .delete(savedDomains)
      .where(
        and(
          eq(savedDomains.id, domainId),
          eq(savedDomains.userId, session.user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete saved domain:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved domain' },
      { status: 500 }
    );
  }
}
