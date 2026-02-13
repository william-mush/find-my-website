import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { usageTracker } from '@/lib/security/usage-tracker';

// Tier-based daily scan limits (must match analyze/route.ts)
const TIER_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  enterprise: Infinity,
};

const ANONYMOUS_DAILY_LIMIT = 2;

export async function GET() {
  try {
    const session = await auth();
    let userTier = 'anonymous';
    let userId: string | undefined;
    let dailyLimit = ANONYMOUS_DAILY_LIMIT;

    if (session?.user?.id) {
      userId = session.user.id;

      const userRecord = await db
        .select({ tier: users.tier })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      userTier = userRecord[0]?.tier || 'free';
      dailyLimit = TIER_LIMITS[userTier] ?? TIER_LIMITS.free;
    }

    const todayUsage = await usageTracker.getDailyUsageCount(
      '/api/network/analyze',
      userId,
      undefined // IP not needed when userId is present; for anonymous this returns 0 which is fine
    );

    return NextResponse.json({
      tier: userTier,
      authenticated: !!session,
      scansUsedToday: todayUsage,
      dailyLimit: dailyLimit === Infinity ? null : dailyLimit,
      remaining: dailyLimit === Infinity ? null : Math.max(0, dailyLimit - todayUsage),
    });
  } catch (error) {
    console.error('[NetworkUsage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage info' },
      { status: 500 }
    );
  }
}
