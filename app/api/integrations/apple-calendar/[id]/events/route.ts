import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { decryptConfig } from '@/lib/utils/encryption';
import { discoverCalendars } from '@/lib/caldav/discovery';
import type { NormalizedEvent, AppleCalendarSetting } from '@/lib/types/calendar';

type CalDavConfig = {
  serverUrl: string;
  username: string;
  password: string;
  calendarSettings?: Record<string, AppleCalendarSetting>;
};

const DEFAULT_APPLE_COLOR = '#1B998B';

function authHeader(u: string, p: string) {
  return `Basic ${Buffer.from(`${u}:${p}`).toString('base64')}`;
}

function isoToCalDav(iso: string) {
  return iso.replace(/-/g, '').replace(/:/g, '').replace('.000Z', 'Z');
}

function buildVCalendar(uid: string, title: string, startIso: string, endIso: string, allDay: boolean, location?: string, description?: string) {
  const dtStart = allDay ? `DTSTART;VALUE=DATE:${startIso.slice(0,10).replace(/-/g,'')}` : `DTSTART:${isoToCalDav(startIso)}`;
  const dtEnd   = allDay ? `DTEND;VALUE=DATE:${endIso.slice(0,10).replace(/-/g,'')}` : `DTEND:${isoToCalDav(endIso)}`;
  const now = isoToCalDav(new Date().toISOString());
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FaithBranch//EN','BEGIN:VEVENT',
    `UID:${uid}`,`DTSTAMP:${now}`,dtStart,dtEnd,`SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    description ? `DESCRIPTION:${description}` : '',
    'END:VEVENT','END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

// ─── ICS field helpers ────────────────────────────────────────────────────────

function getICSField(ics: string, key: string): string | undefined {
  const m = ics.match(new RegExp(`^(?:${key}[^:]*):(.+)$`, 'm'));
  return m ? m[1].replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\').trim() : undefined;
}

function parseCalDavDate(raw: string): string | null {
  const clean = raw.replace(/^[^:]+:/, '').trim();
  if (/^\d{8}$/.test(clean)) return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`;
  const m = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7]==='Z'?'Z':''}`;
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ─── Meeting URL extraction ───────────────────────────────────────────────────

const MEETING_RE = /https?:\/\/[^\s<>"\\]+(?:zoom\.us\/j|meet\.google\.com|teams\.microsoft\.com|webex\.com|whereby\.com|around\.co)[^\s<>"\\]*/i;

function extractMeetingUrl(ics: string): string | undefined {
  // CONFERENCE property (RFC 7986)
  const conf = ics.match(/^CONFERENCE[^:]*:(.+)$/m)?.[1]?.trim();
  if (conf && MEETING_RE.test(conf)) return conf;
  // URL property
  const url = getICSField(ics, 'URL');
  if (url && MEETING_RE.test(url)) return url;
  // Description
  const desc = getICSField(ics, 'DESCRIPTION') ?? '';
  return desc.match(MEETING_RE)?.[0];
}

// ─── RRULE expansion (fallback when CalDAV server doesn't expand) ─────────────

function expandRRule(base: NormalizedEvent, rruleStr: string, exDates: Set<string>, rangeStart: Date, rangeEnd: Date): NormalizedEvent[] {
  const parts: Record<string, string> = Object.fromEntries(
    rruleStr.split(';').map((s) => { const [k, v] = s.split('='); return [k, v]; })
  );
  const freq = parts.FREQ ?? 'DAILY';
  const interval = parseInt(parts.INTERVAL ?? '1', 10);
  const maxCount = parts.COUNT ? parseInt(parts.COUNT, 10) : 3000;
  const untilStr = parts.UNTIL ? parseCalDavDate(parts.UNTIL) : null;
  const until = untilStr ? new Date(untilStr) : null;

  const dayMap: Record<string, number> = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 };
  const byDay = parts.BYDAY
    ? parts.BYDAY.split(',').map((d) => dayMap[d.replace(/[^A-Z]/g, '')]).filter((d): d is number => d !== undefined)
    : null;

  const evStart = new Date(base.startIso);
  const evEnd   = new Date(base.endIso);
  const dur     = evEnd.getTime() - evStart.getTime();
  const fmtDate = (d: Date) => base.allDay
    ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    : d.toISOString();

  function isExcluded(d: Date) {
    const k = base.allDay
      ? `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
      : d.toISOString().replace(/\D/g, '');
    return exDates.has(k);
  }

  const results: NormalizedEvent[] = [];
  let count = 0;

  if (freq === 'WEEKLY' && byDay) {
    // Start from Sunday of the week containing evStart
    const weekBase = new Date(evStart);
    weekBase.setDate(weekBase.getDate() - weekBase.getDay());
    weekBase.setHours(evStart.getHours(), evStart.getMinutes(), evStart.getSeconds(), 0);

    let wk = new Date(weekBase);
    while (count < maxCount) {
      if (until && wk > until) break;
      if (wk > rangeEnd) break;
      for (const td of [...byDay].sort((a, b) => a - b)) {
        const inst = new Date(wk);
        inst.setDate(inst.getDate() + td);
        if (inst < evStart) { count++; continue; }
        if (until && inst > until) { count = maxCount; break; }
        if (inst > rangeEnd) { count = maxCount; break; }
        if (!isExcluded(inst) && inst >= rangeStart) {
          const iEnd = new Date(inst.getTime() + dur);
          results.push({ ...base, id: `${base.id}-r${inst.getTime()}`, startIso: fmtDate(inst), endIso: fmtDate(iEnd) });
        }
        count++;
        if (count >= maxCount) break;
      }
      wk.setDate(wk.getDate() + interval * 7);
    }
  } else {
    let cur = new Date(evStart);
    while (count < maxCount) {
      if (until && cur > until) break;
      if (cur > rangeEnd) break;
      if (!isExcluded(cur) && cur >= rangeStart) {
        const iEnd = new Date(cur.getTime() + dur);
        results.push({ ...base, id: `${base.id}-r${cur.getTime()}`, startIso: fmtDate(cur), endIso: fmtDate(iEnd) });
      }
      count++;
      switch (freq) {
        case 'DAILY':   cur = new Date(cur.getTime() + interval * 86_400_000); break;
        case 'WEEKLY':  cur = new Date(cur.getTime() + interval * 7 * 86_400_000); break;
        case 'MONTHLY': { const m = new Date(cur); m.setMonth(m.getMonth() + interval); cur = m; break; }
        case 'YEARLY':  { const y = new Date(cur); y.setFullYear(y.getFullYear() + interval); cur = y; break; }
        default: count = maxCount;
      }
    }
  }
  return results;
}

// ─── ICS → NormalizedEvent ────────────────────────────────────────────────────

function parseICSToNormalized(ics: string, calendarName: string, calendarColor: string, href: string | null): NormalizedEvent | null {
  const uid     = getICSField(ics, 'UID');
  const summary = getICSField(ics, 'SUMMARY');
  const allDay  = /^DTSTART;VALUE=DATE:/m.test(ics);
  const dtStartRaw = ics.match(/^DTSTART[^:]*:.+$/m)?.[0] ?? '';
  const dtEndRaw   = ics.match(/^DTEND[^:]*:.+$/m)?.[0] ?? '';
  const startIso = parseCalDavDate(dtStartRaw);
  const endIso   = parseCalDavDate(dtEndRaw);
  if (!uid || !startIso) return null;

  // For all-day events, bump end to next day if end equals start (spec: end is exclusive)
  let effectiveEnd = endIso ?? startIso;
  if (allDay && effectiveEnd === startIso) {
    const d = new Date(startIso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    effectiveEnd = d.toISOString().slice(0, 10);
  }

  return {
    id: `a-${uid}`,
    title: summary ?? '(No title)',
    startIso,
    endIso: effectiveEnd,
    allDay,
    calendarName,
    calendarColor,
    location: getICSField(ics, 'LOCATION'),
    description: getICSField(ics, 'DESCRIPTION'),
    url: getICSField(ics, 'URL'),
    meetingUrl: extractMeetingUrl(ics),
    appleHref: href ?? undefined,
  };
}

// ─── Integration lookup ───────────────────────────────────────────────────────

async function getIntegration(id: string) {
  const row = await prisma.integration.findUnique({ where: { id } });
  if (!row || row.type !== IntegrationType.APPLE_CALENDAR) return null;
  return row;
}

// ─── GET = fetch + cache events ───────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const cronSecret = req.headers.get('x-cron-secret');
  const validCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  if (!session && !validCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const isDebug = new URL(req.url).searchParams.get('debug') === '1';
  const row = await getIntegration(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const cfg = decryptConfig<CalDavConfig>(row.config);
  const { serverUrl, username, password, calendarSettings = {} } = cfg;
  const auth = authHeader(username, password);
  const debugLog: string[] = [];

  const calendars = await discoverCalendars(serverUrl, auth, debugLog);

  if (!calendars.length) {
    const cached = await prisma.calendarEventCache.findUnique({ where: { integrationId: id } });
    if (cached) return NextResponse.json({ events: cached.events, fromCache: true, debug: isDebug ? debugLog : undefined });
    return NextResponse.json({ events: [], error: 'Discovery failed', debug: debugLog });
  }

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 0);
  const rangeEnd   = new Date(now.getFullYear() + 1, now.getMonth(), 2);

  const report = (s: string, e: string) => `<?xml version="1.0" encoding="utf-8"?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop><D:getetag/><C:calendar-data/></D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${s}" end="${e}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  const allEvents: NormalizedEvent[] = [];
  const rawResponses: string[] = [];

  for (const cal of calendars) {
    const settings = calendarSettings[cal.name] ?? {};
    if (settings.enabled === false) { debugLog.push(`skip disabled: ${cal.name}`); continue; }
    const calColor = settings.color ?? DEFAULT_APPLE_COLOR;

    try {
      const res = await fetch(cal.url, {
        method: 'REPORT',
        headers: { Authorization: auth, Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' },
        body: report(isoToCalDav(rangeStart.toISOString()), isoToCalDav(rangeEnd.toISOString())),
      });
      const text = await res.text();
      if (isDebug) rawResponses.push(`=== REPORT ${cal.name} → ${res.status} ===\n${text.slice(0,3000)}`);
      if (!res.ok) { debugLog.push(`REPORT ${cal.name} → ${res.status}`); continue; }

      const icsBlocks = text.match(/BEGIN:VCALENDAR[\s\S]*?END:VCALENDAR/g) ?? [];
      const hrefMatches = [...text.matchAll(/<[^:>]*:?href[^>]*>([^<]+)<\/[^:>]*:?href>/gi)];

      let count = 0;
      icsBlocks.forEach((ics, i) => {
        const href = hrefMatches[i]?.[1]?.trim() ?? null;
        const hasRRule = /^RRULE:/m.test(ics);
        const hasRecurrenceId = /^RECURRENCE-ID/m.test(ics);

        if (hasRRule && !hasRecurrenceId) {
          // CalDAV server did not expand this recurring event — do it client-side
          const rrule = getICSField(ics, 'RRULE') ?? '';

          // Collect EXDATE values
          const exDates = new Set<string>();
          const exDateMatches = ics.match(/^EXDATE[^:]*:(.+)$/gm) ?? [];
          for (const ex of exDateMatches) {
            const vals = ex.replace(/^EXDATE[^:]*:/, '').split(',');
            for (const v of vals) exDates.add(v.trim().replace(/\D/g, ''));
          }

          const base = parseICSToNormalized(ics, cal.name, calColor, null);
          if (base) {
            const expanded = expandRRule(base, rrule, exDates, rangeStart, rangeEnd);
            allEvents.push(...expanded);
            count += expanded.length;
          }
        } else {
          const ev = parseICSToNormalized(ics, cal.name, calColor, href);
          if (ev) { allEvents.push(ev); count++; }
        }
      });

      debugLog.push(`REPORT ${cal.name} → ${res.status}, ${count} events`);
    } catch (e) { debugLog.push(`REPORT ${cal.name} → error: ${String(e)}`); }
  }

  const eventsJson = allEvents as unknown as import('@prisma/client').Prisma.InputJsonValue;
  await prisma.calendarEventCache.upsert({
    where: { integrationId: id },
    create: { integrationId: id, events: eventsJson, cachedAt: new Date() },
    update: { events: eventsJson, cachedAt: new Date() },
  });

  if (isDebug) return NextResponse.json({ events: allEvents, debug: debugLog, raw: rawResponses });
  return NextResponse.json({ events: allEvents });
}

// ─── POST = create event ──────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getIntegration(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { serverUrl, username, password } = decryptConfig<CalDavConfig>(row.config);
  const auth = authHeader(username, password);
  const { title, startIso, endIso, allDay, location, description } = await req.json();
  if (!title || !startIso || !endIso) return NextResponse.json({ error: 'title, startIso, endIso required' }, { status: 400 });

  const debugLog: string[] = [];
  const calendars = await discoverCalendars(serverUrl, auth, debugLog);
  const target = calendars[0]?.url;
  if (!target) return NextResponse.json({ error: 'Could not discover calendar', debug: debugLog }, { status: 502 });

  const uid = randomUUID();
  const ics = buildVCalendar(uid, title, startIso, endIso, allDay ?? false, location, description);
  const eventUrl = target.replace(/\/$/, '') + `/${uid}.ics`;

  const res = await fetch(eventUrl, {
    method: 'PUT',
    headers: { Authorization: auth, 'Content-Type': 'text/calendar; charset=utf-8', 'If-None-Match': '*' },
    body: ics,
  });
  if (res.status >= 400) return NextResponse.json({ error: `CalDAV error ${res.status}` }, { status: 502 });
  return NextResponse.json({ ok: true, uid, href: eventUrl });
}

// ─── PATCH = update event ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getIntegration(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { serverUrl, username, password } = decryptConfig<CalDavConfig>(row.config);
  const auth = authHeader(username, password);
  const { href, uid, title, startIso, endIso, allDay, location, description } = await req.json();
  if (!href || !uid) return NextResponse.json({ error: 'href and uid required' }, { status: 400 });

  const ics = buildVCalendar(uid, title, startIso, endIso, allDay ?? false, location, description);
  const eventUrl = href.startsWith('http') ? href : new URL(href, serverUrl).toString();
  const res = await fetch(eventUrl, { method: 'PUT', headers: { Authorization: auth, 'Content-Type': 'text/calendar; charset=utf-8' }, body: ics });
  if (res.status >= 400) return NextResponse.json({ error: `CalDAV error ${res.status}` }, { status: 502 });
  return NextResponse.json({ ok: true });
}

// ─── DELETE = delete event ────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getIntegration(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { serverUrl, username, password } = decryptConfig<CalDavConfig>(row.config);
  const auth = authHeader(username, password);
  const href = new URL(req.url).searchParams.get('href');
  if (!href) return NextResponse.json({ error: 'href required' }, { status: 400 });

  const eventUrl = href.startsWith('http') ? href : new URL(href, serverUrl).toString();
  const res = await fetch(eventUrl, { method: 'DELETE', headers: { Authorization: auth } });
  if (res.status >= 400 && res.status !== 404) return NextResponse.json({ error: `CalDAV error ${res.status}` }, { status: 502 });
  return NextResponse.json({ ok: true });
}
