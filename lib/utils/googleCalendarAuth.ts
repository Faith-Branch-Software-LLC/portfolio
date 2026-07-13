import { prisma } from '../db';
import { decryptConfig, encryptConfig } from './encryption';
import type { GoogleCalendarSetting } from '../types/calendar';

export type GoogleConfig = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email?: string;
  calendarSettings?: Record<string, GoogleCalendarSetting>;
  authError?: boolean;
};

// Refreshes the access token if needed, persisting the result. Returns null
// (and flags the integration with authError) if the refresh token itself is
// no longer valid — the user has to reconnect via the Connections tab.
export async function getValidGoogleToken(
  integrationId: string,
): Promise<{ token: string; cfg: GoogleConfig } | null> {
  const row = await prisma.integration.findUnique({ where: { id: integrationId } });
  if (!row || row.type !== 'GOOGLE_CALENDAR') return null;

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

  if (!res.ok) {
    // invalid_grant (revoked/expired refresh token) means reconnect is required —
    // flag it so the Connections UI can surface that instead of silently going blank.
    const body = await res.json().catch(() => ({}));
    if (body.error === 'invalid_grant') {
      await prisma.integration.update({
        where: { id: integrationId },
        data: { config: encryptConfig({ ...cfg, authError: true }) },
      });
      return null;
    }
    // Transient failure (network blip, Google outage) — keep using the still-cached
    // token rather than forcing a reconnect for something that'll likely resolve itself.
    return { token: cfg.accessToken, cfg };
  }

  const refreshed = await res.json();
  const updated: GoogleConfig = {
    ...cfg,
    accessToken: refreshed.access_token,
    expiresAt: Date.now() + refreshed.expires_in * 1000,
    authError: false,
  };
  await prisma.integration.update({
    where: { id: integrationId },
    data: { config: encryptConfig(updated) },
  });
  return { token: updated.accessToken, cfg: updated };
}
