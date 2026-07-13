import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { getValidGoogleToken } from '@/lib/utils/googleCalendarAuth';

async function getToken(integrationId: string): Promise<string | null> {
  const result = await getValidGoogleToken(integrationId);
  return result?.token ?? null;
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
