import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import { decryptConfig, encryptConfig } from '@/lib/utils/encryption';

async function getToken(integrationId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
  if (!integration || integration.type !== IntegrationType.GOOGLE_CALENDAR) return null;

  const cfg = decryptConfig<{ accessToken: string; refreshToken: string; expiresAt: number }>(integration.config);
  if (Date.now() < cfg.expiresAt - 60_000) return cfg.accessToken;

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
  if (!res.ok) return cfg.accessToken;
  const refreshed = await res.json();
  const accessToken = refreshed.access_token;
  await prisma.integration.update({
    where: { id: integrationId },
    data: { config: encryptConfig({ ...cfg, accessToken, expiresAt: Date.now() + refreshed.expires_in * 1000 }) },
  });
  return accessToken;
}

// POST = create event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const token = await getToken(id);
  if (!token) return NextResponse.json({ error: 'Integration not found' }, { status: 404 });

  const body = await req.json();
  const { title, startIso, endIso, allDay, location, description } = body;

  const event: Record<string, unknown> = {
    summary: title,
    location,
    description,
    start: allDay ? { date: startIso } : { dateTime: startIso },
    end:   allDay ? { date: endIso }   : { dateTime: endIso },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!res.ok) return NextResponse.json({ error: 'Google API error', detail: await res.text() }, { status: res.status });
  return NextResponse.json(await res.json());
}

// PATCH = update event
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const token = await getToken(id);
  if (!token) return NextResponse.json({ error: 'Integration not found' }, { status: 404 });

  const body = await req.json();
  const { eventId, title, startIso, endIso, allDay, location, description } = body;

  const event: Record<string, unknown> = {
    summary: title,
    location,
    description,
    start: allDay ? { date: startIso } : { dateTime: startIso },
    end:   allDay ? { date: endIso }   : { dateTime: endIso },
  };

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!res.ok) return NextResponse.json({ error: 'Google API error', detail: await res.text() }, { status: res.status });
  return NextResponse.json(await res.json());
}

// DELETE = delete event
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const token = await getToken(id);
  if (!token) return NextResponse.json({ error: 'Integration not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 410) {
    return NextResponse.json({ error: 'Google API error' }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
