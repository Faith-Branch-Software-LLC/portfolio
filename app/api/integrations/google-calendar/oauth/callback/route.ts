import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import { decryptConfig, encryptConfig } from '@/lib/utils/encryption';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login`);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin/connections?gcal_error=${encodeURIComponent(error ?? 'no_code')}`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-calendar/oauth/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/admin/connections?gcal_error=token_exchange_failed`
    );
  }

  const tokens = await tokenRes.json();

  // Fetch email to use as default name
  let email = '';
  try {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (infoRes.ok) email = (await infoRes.json()).email ?? '';
  } catch {}

  // Decode label + reconnect target from state
  let label = '';
  let integrationId = '';
  const stateParam = searchParams.get('state');
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
      label = decoded.name ?? '';
      integrationId = decoded.integrationId ?? '';
    } catch {}
  }

  const name = label || email || 'Google Calendar';
  const newConfig = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: Date.now() + tokens.expires_in * 1000, email };

  // Reconnecting a specific integration — update it in place so calendarSettings
  // (per-calendar colors/enabled) and the id survive, and drop the authError flag.
  const existing = integrationId
    ? await prisma.integration.findUnique({ where: { id: integrationId } })
    : null;

  if (existing && existing.type === IntegrationType.GOOGLE_CALENDAR) {
    const prevCfg = decryptConfig<{ calendarSettings?: unknown }>(existing.config);
    await prisma.integration.update({
      where: { id: integrationId },
      data: { config: encryptConfig({ ...newConfig, calendarSettings: prevCfg.calendarSettings, authError: false }) },
    });
  } else {
    await prisma.integration.create({
      data: {
        type: IntegrationType.GOOGLE_CALENDAR,
        name,
        config: encryptConfig(newConfig),
      },
    });
  }

  const redirectTo = existing ? '/admin/calendar?gcal_reconnected=1' : '/admin/connections?gcal_connected=1';
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}${redirectTo}`);
}
