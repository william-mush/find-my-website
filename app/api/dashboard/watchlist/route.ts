import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { domainWatchlist } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/dashboard/watchlist - List watchlist domains
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const watchlist = await db
      .select()
      .from(domainWatchlist)
      .where(eq(domainWatchlist.userId, session.user.id))
      .orderBy(desc(domainWatchlist.createdAt));

    return NextResponse.json({
      watchlist,
      total: watchlist.length,
    });
  } catch (error) {
    console.error('Failed to fetch watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/watchlist - Add domain to watchlist
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { domain, alertOnChange } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Check if already watching
    const existing = await db
      .select()
      .from(domainWatchlist)
      .where(
        and(
          eq(domainWatchlist.userId, session.user.id),
          eq(domainWatchlist.domain, domain.toLowerCase().trim())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Domain already in watchlist', existing: existing[0] },
        { status: 409 }
      );
    }

    const [watched] = await db
      .insert(domainWatchlist)
      .values({
        userId: session.user.id,
        domain: domain.toLowerCase().trim(),
        alertOnChange: alertOnChange !== false,
      })
      .returning();

    return NextResponse.json({ watchlist: watched }, { status: 201 });
  } catch (error) {
    console.error('Failed to add to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}
