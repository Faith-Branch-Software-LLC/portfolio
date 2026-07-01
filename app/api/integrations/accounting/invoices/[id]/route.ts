import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { AkauntingClient } from '@/lib/akaunting';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await AkauntingClient.fromDb();
  if (!client) return NextResponse.json({ error: 'Accounting not configured' }, { status: 400 });

  const { id } = await params;
  const invoiceId = parseInt(id);
  if (isNaN(invoiceId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const invoice = await client.getInvoiceById(invoiceId);
    return NextResponse.json(invoice);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
