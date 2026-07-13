import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import { getValidGoogleToken } from '@/lib/utils/googleCalendarAuth';
import type { NormalizedEvent } from '@/lib/types/calendar';

const FALLBACK_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#9C27B0', '#FF6D00'];

function darkenIfLight(hex: string): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum <= 0.55) return hex;
  const d = (v: number) => Math.round(v * 0.55).toString(16).padStart(2, '0');
  return `#${d(r)}${d(g)}${d(b)}`;
}

const MEETING_RE = /https?:\/\/[^\s<>"\\]+(?:zoom\.us\/j|meet\.google\.com|teams\.microsoft\.com|webex\.com|whereby\.com|around\.co)[^\s<>"\\]*/i;

function extractGoogleMeetingUrl(e: Record<string, unknown>): string | undefined {
  if (typeof e.hangoutLink === 'string') return e.hangoutLink;
  const conf = e.conferenceData as Record<string, unknown> | undefined;
  if (conf) {
    const eps = (conf.entryPoints as Record<string, unknown>[] | undefined) ?? [];
    for (const ep of eps) {
      if (ep.entryPointType === 'video' && typeof ep.uri === 'string') return ep.uri;
    }
  }
  const desc = typeof e.description === 'string' ? e.description : '';
  return desc.match(MEETING_RE)?.[0];
}

function normalizeGoogleEvent(e: Record<string, unknown>, calendarName: string, calendarColor: string): NormalizedEvent | null {
  const startRaw = e.start as Record<string, string> | undefined;
  const endRaw   = e.end   as Record<string, string> | undefined;
  if (!startRaw) return null;
  const allDay   = !!startRaw.date && !startRaw.dateTime;
  const startIso = startRaw.dateTime ?? startRaw.date ?? '';
  let endIso     = endRaw?.dateTime ?? endRaw?.date ?? startIso;
  if (!startIso) return null;
  if (allDay && endIso === startIso) {
    const d = new Date(startIso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    endIso = d.toISOString().slice(0, 10);
  }
  return {
    id: `g-${String(e.id)}`,
    title: String(e.summary ?? '(No title)'),
    startIso, endIso, allDay,
    calendarName, calendarColor,
    location: e.location as string | undefined,
    description: e.description as string | undefined,
    url: undefined,
    meetingUrl: extractGoogleMeetingUrl(e),
    googleEventId: String(e.id),
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const cronSecret = req.headers.get('x-cron-secret');
  const validCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  if (!session && !validCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const integrations = await prisma.integration.findMany({ where: { type: IntegrationType.GOOGLE_CALENDAR } });
  if (!integrations.length) return NextResponse.json({ sources: [] });

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const end   = new Date(now.getFullYear() + 1, now.getMonth(), 1);
  const timeParams = `timeMin=${start.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=2500&fields=items(id,summary,start,end,location,description,hangoutLink,conferenceData,status)&conferenceDataVersion=1`;

  const sources = await Promise.all(integrations.map(async (integration, idx) => {
    const fallbackColor = FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    try {
      const authResult = await getValidGoogleToken(integration.id);
      if (!authResult) throw new Error('needs reconnect');
      const { token: accessToken, cfg } = authResult;
      const settings = cfg.calendarSettings ?? {};

      const calListRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&maxResults=250',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const calList: Record<string, unknown>[] = calListRes.ok ? (await calListRes.json()).items ?? [] : [];

      const allEvents: NormalizedEvent[] = [];
      await Promise.all(calList.map(async (cal) => {
        const calId = String(cal.id);
        const s = settings[calId] ?? {};
        // Skip if user disabled this calendar or Google has it hidden
        if (s.enabled === false || cal.hidden === true) return;

        const googleColor = (cal.backgroundColor as string | undefined) ?? fallbackColor;
        const calColor = s.color ?? darkenIfLight(googleColor);
        const calName  = String(cal.summary ?? 'Calendar');

        const evRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${timeParams}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!evRes.ok) return;
        const items: Record<string, unknown>[] = (await evRes.json()).items ?? [];
        for (const item of items) {
          const ev = normalizeGoogleEvent(item, calName, calColor);
          if (ev) allEvents.push(ev);
        }
      }));

      const eventsJson = allEvents as unknown as import('@prisma/client').Prisma.InputJsonValue;
      await prisma.calendarEventCache.upsert({
        where: { integrationId: integration.id },
        create: { integrationId: integration.id, events: eventsJson, cachedAt: new Date() },
        update: { events: eventsJson, cachedAt: new Date() },
      });

      return { integrationId: integration.id, name: integration.name, events: allEvents };
    } catch {
      const cached = await prisma.calendarEventCache.findUnique({ where: { integrationId: integration.id } });
      return { integrationId: integration.id, name: integration.name, events: (cached?.events as unknown as NormalizedEvent[]) ?? [], fromCache: true };
    }
  }));

  return NextResponse.json({ sources });
}
