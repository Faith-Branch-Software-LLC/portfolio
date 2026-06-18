import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.BASECAMP_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'BASECAMP_CLIENT_ID not set' }, { status: 500 });

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/basecamp/oauth/callback`;
  const url = `https://launchpad.37signals.com/authorization/new?type=web_server&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(url);
}
