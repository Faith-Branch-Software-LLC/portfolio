import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { getPoolMonthlyReport } from '@/lib/actions/admin/pools';
import { renderPoolMonthlyReportPdf } from '@/lib/pool-monthly-report-pdf';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (monthParam) {
    const match = /^(\d{4})-(\d{2})$/.exec(monthParam);
    if (!match) return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    year = parseInt(match[1], 10);
    month = parseInt(match[2], 10) - 1;
  }

  const pools = await getPoolMonthlyReport(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const buffer = await renderPoolMonthlyReportPdf({ monthLabel, pools });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pool-monthly-${year}-${String(month + 1).padStart(2, '0')}.pdf"`,
    },
  });
}
