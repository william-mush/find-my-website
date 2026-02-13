import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { savedDomains } from '@/lib/db/schema';
import { eq, desc, and, ilike, or } from 'drizzle-orm';

// GET /api/dashboard/saved-domains - List saved domains
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';

    let query = db
      .select()
      .from(savedDomains)
      .where(eq(savedDomains.userId, session.user.id))
      .orderBy(desc(savedDomains.createdAt));

    // Apply search filter
    if (search) {
      query = db
        .select()
        .from(savedDomains)
        .where(
          and(
            eq(savedDomains.userId, session.user.id),
            or(
              ilike(savedDomains.domain, `%${search}%`),
              ilike(savedDomains.notes, `%${search}%`)
            )
          )
        )
        .orderBy(desc(savedDomains.createdAt));
    }

    const domains = await query;

    // Filter by tag if specified (done in JS since tags is JSONB)
    let filteredDomains = domains;
    if (tag) {
      filteredDomains = domains.filter((d) => {
        const tags = d.tags as string[] | null;
        return tags?.includes(tag);
      });
    }

    return NextResponse.json({
      domains: filteredDomains,
      total: filteredDomains.length,
    });
  } catch (error) {
    console.error('Failed to fetch saved domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved domains' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/saved-domains - Save a domain
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { domain, notes, tags } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Check if domain is already saved by this user
    const existing = await db
      .select()
      .from(savedDomains)
      .where(
        and(
          eq(savedDomains.userId, session.user.id),
          eq(savedDomains.domain, domain.toLowerCase().trim())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Domain already saved', existing: existing[0] },
        { status: 409 }
      );
    }

    const [saved] = await db
      .insert(savedDomains)
      .values({
        userId: session.user.id,
        domain: domain.toLowerCase().trim(),
        notes: notes || null,
        tags: Array.isArray(tags) ? tags : [],
      })
      .returning();

    return NextResponse.json({ domain: saved }, { status: 201 });
  } catch (error) {
    console.error('Failed to save domain:', error);
    return NextResponse.json(
      { error: 'Failed to save domain' },
      { status: 500 }
    );
  }
}
