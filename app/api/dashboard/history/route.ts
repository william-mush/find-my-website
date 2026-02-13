import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { searchHistory } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

// GET /api/dashboard/history - List search history with pagination
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type'); // 'domain' or 'network'
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(searchHistory.userId, session.user.id)];

    if (from) {
      conditions.push(gte(searchHistory.createdAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(searchHistory.createdAt, new Date(to)));
    }
    if (type && (type === 'domain' || type === 'network')) {
      conditions.push(eq(searchHistory.analysisType, type));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(searchHistory)
      .where(whereClause);

    const total = Number(countResult.count);

    // Get paginated results
    const history = await db
      .select()
      .from(searchHistory)
      .where(whereClause)
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch search history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    );
  }
}
