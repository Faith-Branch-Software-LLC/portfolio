import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { saveBasecampIntegration } from '@/lib/actions/admin/integrations';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL('/admin/login', req.url));

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/admin/connections?bc_error=no_code', req.url));
  }

  const clientId = process.env.BASECAMP_CLIENT_ID;
  const clientSecret = process.env.BASECAMP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/admin/connections?bc_error=missing_env', req.url));
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/basecamp/oauth/callback`;

  const tokenRes = await fetch(
    `https://launchpad.37signals.com/authorization/token?type=web_server&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/admin/connections?bc_error=token_exchange_failed', req.url));
  }

  const data = await tokenRes.json();
  const accessToken: string = data.access_token;
  if (!accessToken) {
    return NextResponse.redirect(new URL('/admin/connections?bc_error=no_token', req.url));
  }

  // Token response has no accounts — fetch them separately
  const authRes = await fetch('https://launchpad.37signals.com/authorization.json', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!authRes.ok) {
    return NextResponse.redirect(new URL('/admin/connections?bc_error=auth_info_failed', req.url));
  }
  const authData = await authRes.json();

  const accounts: { id: number; product: string; href: string }[] = authData.accounts ?? [];
  const bcAccount = accounts.find((a) => a.product === 'bc3' || a.product === 'bc4' || a.product === 'bc5') ?? accounts[0];
  const accountId: string = bcAccount ? String(bcAccount.id) : '';

  if (!accountId) {
    return NextResponse.redirect(new URL(`/admin/connections?bc_error=no_bc_account`, req.url));
  }

  const apiBase = bcAccount.href
    ? new URL(bcAccount.href).origin
    : 'https://3.basecampapi.com';

  await saveBasecampIntegration(accessToken, accountId, apiBase);
  return NextResponse.redirect(new URL('/admin/connections?bc_connected=1', req.url));
}
