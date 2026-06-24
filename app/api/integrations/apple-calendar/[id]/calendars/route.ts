import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import { decryptConfig, encryptConfig } from '@/lib/utils/encryption';
import { discoverCalendars } from '@/lib/caldav/discovery';
import type { AppleCalendarInfo, AppleCalendarSetting } from '@/lib/types/calendar';

const DEFAULT_COLORS = [
  '#1B998B','#4285F4','#EA4335','#FBBC05','#34A853',
  '#9B59B6','#E67E22','#E91E63','#00BCD4','#FF5722',
];

type CalDavConfig = {
  serverUrl: string;
  username: string;
  password: string;
  calendarSettings?: Record<string, AppleCalendarSetting>;
};

async function getRow(id: string) {
  const row = await prisma.integration.findUnique({ where: { id } });
  if (!row || row.type !== IntegrationType.APPLE_CALENDAR) return null;
  return row;
}

// GET — list discovered calendars with current settings applied
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getRow(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const cfg = decryptConfig<CalDavConfig>(row.config);
  const auth = `Basic ${Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64')}`;
  const settings = cfg.calendarSettings ?? {};
  const debug: string[] = [];

  const discovered = await discoverCalendars(cfg.serverUrl, auth, debug);

  const calendars: AppleCalendarInfo[] = discovered.map((cal, i) => {
    const s = settings[cal.name] ?? {};
    return {
      name: cal.name,
      url: cal.url,
      color: s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      enabled: s.enabled !== false,
      order: s.order ?? i,
    };
  });

  calendars.sort((a, b) => a.order - b.order);

  return NextResponse.json({ calendars });
}

// PATCH — save per-calendar settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await getRow(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { settings } = await req.json() as { settings: Record<string, AppleCalendarSetting> };
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'settings object required' }, { status: 400 });
  }

  const cfg = decryptConfig<CalDavConfig>(row.config);
  const merged: CalDavConfig = { ...cfg, calendarSettings: settings };

  await prisma.integration.update({
    where: { id },
    data: { config: encryptConfig(merged) },
  });

  return NextResponse.json({ ok: true });
}
