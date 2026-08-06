import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { getPoolHoursSummary } from '@/lib/actions/admin/pools';
import { isTimeRangePreset, presetRange, rangeLabel } from '@/lib/time-range';
import { renderPoolHoursReportPdf } from '@/lib/pool-hours-report-pdf';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const presetParam = searchParams.get('preset') ?? 'lastTwoWeeks';

  if (!isTimeRangePreset(presetParam)) {
    return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });
  }

  const range = presetRange(presetParam, {
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  });
  if (!range) {
    return NextResponse.json({ error: 'Missing custom range dates' }, { status: 400 });
  }

  const summary = await getPoolHoursSummary(range.from, range.to);
  const label = rangeLabel(presetParam, range.from, range.to);

  const buffer = await renderPoolHoursReportPdf({ rangeLabel: label, summary });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pool-hours-${slugify(label)}.pdf"`,
    },
  });
}
