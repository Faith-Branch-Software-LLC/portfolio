import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { AkauntingClient } from '@/lib/akaunting';
import { renderReceipt } from '@/lib/receipt-pdf';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const invoiceId = parseInt(id);
  if (isNaN(invoiceId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const client = await AkauntingClient.fromDb();
  if (!client) return NextResponse.json({ error: 'Accounting not configured' }, { status: 400 });

  try {
    const invoice = await client.getInvoiceById(invoiceId);
    const paidAtParam = new URL(req.url).searchParams.get('paidAt');
    if (paidAtParam) invoice.paid_at = paidAtParam;
    const pdfBuffer = await renderReceipt(invoice);
    const pdf = new Uint8Array(pdfBuffer);

    const docNum = invoice.document_number || `invoice-${invoiceId}`;
    const filename = `receipt-${docNum.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
