import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { AkauntingClient } from '@/lib/akaunting';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await AkauntingClient.fromDb();
  if (!client) return NextResponse.json({ error: 'Accounting not configured' }, { status: 400 });

  const page = parseInt(new URL(req.url).searchParams.get('page') ?? '1');
  try {
    const result = await client.getInvoices(page);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await AkauntingClient.fromDb();
  if (!client) return NextResponse.json({ error: 'Accounting not configured' }, { status: 400 });

  const body = await req.json();
  const { clientName, clientEmail, issuedAt, dueAt, items, notes, currencyCode } = body as {
    clientName: string;
    clientEmail?: string;
    issuedAt: string;
    dueAt: string;
    items: { name: string; quantity: number; price: number }[];
    notes?: string;
    currencyCode?: string;
  };

  if (!clientName || !issuedAt || !dueAt || !items?.length) {
    return NextResponse.json(
      { error: 'clientName, issuedAt, dueAt, and items required' },
      { status: 400 }
    );
  }

  try {
    const contact = await client.findOrCreateContact(clientName, clientEmail);
    const invoice = await client.createInvoice({
      contactId: contact.id,
      issuedAt,
      dueAt,
      items,
      notes,
      currencyCode,
    });
    return NextResponse.json(invoice);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
