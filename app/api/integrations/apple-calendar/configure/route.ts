import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import { deleteIntegrationById } from '@/lib/actions/admin/integrations';
import { encryptConfig } from '@/lib/utils/encryption';

// Discover CalDAV home set for iCloud or any CalDAV server
async function discoverCalDavUrl(serverUrl: string, username: string, password: string): Promise<string | null> {
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const wellKnown = serverUrl.replace(/\/$/, '') + '/.well-known/caldav';

  const res = await fetch(wellKnown, {
    method: 'PROPFIND',
    headers: {
      Authorization: `Basic ${auth}`,
      Depth: '0',
      'Content-Type': 'application/xml; charset=utf-8',
    },
    body: `<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:current-user-principal/></D:prop></D:propfind>`,
    redirect: 'follow',
  });

  if (!res.ok) return null;
  const text = await res.text();

  // Extract href from current-user-principal
  const hrefMatch = text.match(/<current-user-principal[^>]*>\s*<href[^>]*>([^<]+)<\/href>/i)
    ?? text.match(/<D:href>([^<]+)<\/D:href>/i);
  if (!hrefMatch) return null;

  const principalPath = hrefMatch[1];
  const baseUrl = new URL(wellKnown);
  return new URL(principalPath, baseUrl.origin).toString();
}

// POST = connect a CalDAV calendar (iCloud or other)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, serverUrl, username, password } = await req.json();
  if (!serverUrl || !username || !password) {
    return NextResponse.json({ error: 'serverUrl, username, and password required' }, { status: 400 });
  }

  // Quick auth probe
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const base = serverUrl.replace(/\/$/, '');
  const propfindBody = `<?xml version="1.0"?><D:propfind xmlns:D="DAV:"><D:prop><D:current-user-principal/></D:prop></D:propfind>`;
  const headers = { Authorization: `Basic ${auth}`, Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' };

  let probeOk = false;
  try {
    // Step 1: resolve well-known redirect manually (iCloud 301 → GET if redirect:follow, dropping PROPFIND body)
    const r0 = await fetch(`${base}/.well-known/caldav`, { method: 'PROPFIND', headers, body: propfindBody, redirect: 'manual' });
    let targetUrl = base;
    if (r0.status >= 300 && r0.status < 400) {
      const loc = r0.headers.get('location');
      if (loc) targetUrl = new URL(loc, base).toString().replace(/\/$/, '');
    }
    // Step 2: PROPFIND on resolved URL with auth
    const r1 = await fetch(targetUrl, { method: 'PROPFIND', headers, body: propfindBody, redirect: 'follow' });
    // 207 = CalDAV success; 403 = authed but no resource access; 401 = bad creds
    probeOk = r1.status !== 401 && r1.status < 500;
    if (r1.status === 401) {
      return NextResponse.json({ error: 'Invalid credentials. For iCloud, use your Apple ID email and an app-specific password from appleid.apple.com → Security.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Could not reach CalDAV server' }, { status: 400 });
  }

  if (!probeOk) {
    return NextResponse.json({ error: 'Invalid credentials or server URL' }, { status: 401 });
  }

  await prisma.integration.create({
    data: {
      type: IntegrationType.APPLE_CALENDAR,
      name: name || username,
      config: encryptConfig({ serverUrl, username, password }),
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/integrations/apple-calendar/configure?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await deleteIntegrationById(id);
  return NextResponse.json({ ok: true });
}
