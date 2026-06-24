import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import { decryptConfig, encryptConfig } from '@/lib/utils/encryption';
import type { GoogleCalendarInfo, GoogleCalendarSetting } from '@/lib/types/calendar';

type GoogleConfig = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email?: string;
  calendarSettings?: Record<string, GoogleCalendarSetting>;
};

// Darken colors that are too light to see on white backgrounds
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

async function getToken(integrationId: string): Promise<{ token: string; cfg: GoogleConfig } | null> {
  const row = await prisma.integration.findUnique({ where: { id: integrationId } });
  if (!row || row.type !== IntegrationType.GOOGLE_CALENDAR) return null;

  const cfg = decryptConfig<GoogleConfig>(row.config);
  if (Date.now() < cfg.expiresAt - 60_000) return { token: cfg.accessToken, cfg };

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: cfg.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) return { token: cfg.accessToken, cfg };
  const refreshed = await res.json();
  const updated: GoogleConfig = { ...cfg, accessToken: refreshed.access_token, expiresAt: Date.now() + refreshed.expires_in * 1000 };
  await prisma.integration.update({ where: { id: integrationId }, data: { config: encryptConfig(updated) } });
  return { token: updated.accessToken, cfg: updated };
}

// GET — list all Google calendars for this integration with applied settings
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await getToken(id);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { token, cfg } = result;
  const settings = cfg.calendarSettings ?? {};

  const listRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&maxResults=250',
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!listRes.ok) return NextResponse.json({ error: 'Google API error' }, { status: 502 });

  const items: Record<string, unknown>[] = (await listRes.json()).items ?? [];
  const calendars: GoogleCalendarInfo[] = items.map((cal) => {
    const calId = String(cal.id);
    const googleColor = (cal.backgroundColor as string | undefined) ?? '#4285F4';
    const s = settings[calId] ?? {};
    return {
      id: calId,
      name: String(cal.summary ?? calId),
      googleColor,
      color: s.color ?? darkenIfLight(googleColor),
      enabled: s.enabled !== false && cal.hidden !== true,
    };
  });

  return NextResponse.json({ calendars });
}

// PATCH — save per-calendar color/enabled overrides
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const row = await prisma.integration.findUnique({ where: { id } });
  if (!row || row.type !== IntegrationType.GOOGLE_CALENDAR) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { settings } = await req.json() as { settings: Record<string, GoogleCalendarSetting> };
  if (!settings || typeof settings !== 'object') return NextResponse.json({ error: 'settings required' }, { status: 400 });

  const cfg = decryptConfig<GoogleConfig>(row.config);
  await prisma.integration.update({
    where: { id },
    data: { config: encryptConfig({ ...cfg, calendarSettings: settings }) },
  });

  return NextResponse.json({ ok: true });
}
