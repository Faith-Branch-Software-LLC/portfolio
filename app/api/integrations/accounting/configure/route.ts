import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import {
  AkauntingClient,
  AkauntingConfig,
  deleteAkauntingConfig,
  getAkauntingConfig,
  saveAkauntingConfig,
} from '@/lib/akaunting';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const config = await getAkauntingConfig();
  if (!config) return NextResponse.json({ connected: false });
  return NextResponse.json({ connected: true, url: config.url, companyId: config.companyId });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, email, password, companyId } = (await req.json()) as Partial<AkauntingConfig>;
  if (!url || !email || !password || !companyId) {
    return NextResponse.json({ error: 'url, email, password, and companyId required' }, { status: 400 });
  }

  const client = new AkauntingClient({ url, email, password, companyId });
  const test = await client.testConnection();
  if (!test.ok) {
    return NextResponse.json({ error: test.error ?? 'Connection failed' }, { status: 400 });
  }

  await saveAkauntingConfig({ url, email, password, companyId });
  return NextResponse.json({ ok: true, companyName: test.companyName });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteAkauntingConfig();
  return NextResponse.json({ ok: true });
}
