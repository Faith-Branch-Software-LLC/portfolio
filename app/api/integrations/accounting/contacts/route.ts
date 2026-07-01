import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { AkauntingClient } from '@/lib/akaunting';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await AkauntingClient.fromDb();
  if (!client) return NextResponse.json({ error: 'Accounting not configured' }, { status: 400 });

  try {
    const contacts = await client.getContacts();
    return NextResponse.json(contacts);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
