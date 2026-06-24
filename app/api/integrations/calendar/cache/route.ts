import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import type { CacheEntry } from '@/lib/types/calendar';

const STALE_MS = 30 * 60 * 1000; // 30 min

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const caches = await prisma.calendarEventCache.findMany({
    include: { integration: { select: { id: true, name: true, type: true } } },
  });

  const entries: CacheEntry[] = caches
    .filter((c) => c.integration.type === IntegrationType.GOOGLE_CALENDAR || c.integration.type === IntegrationType.APPLE_CALENDAR)
    .map((c) => ({
      integrationId: c.integrationId,
      name: c.integration.name,
      type: c.integration.type as 'GOOGLE_CALENDAR' | 'APPLE_CALENDAR',
      events: c.events as unknown as CacheEntry['events'],
      cachedAt: c.cachedAt.toISOString(),
    }));

  const now = Date.now();
  const stale = entries.some((e) => now - new Date(e.cachedAt).getTime() > STALE_MS);

  return NextResponse.json({ entries, stale });
}
