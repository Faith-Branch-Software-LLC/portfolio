import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/actions/authOptions';
import { prisma } from '@/lib/db';
import { getClientTimeRangeSummary } from '@/lib/actions/admin/time';
import { isTimeRangePreset, presetRange, rangeLabel, formatMinutes } from '@/lib/time-range';
import { renderTimeReportPdf } from '@/lib/time-report-pdf';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildTextReport(clientName: string, label: string, summary: Awaited<ReturnType<typeof getClientTimeRangeSummary>>): string {
  const lines: string[] = [];
  lines.push(`${clientName} — Work Summary`);
  lines.push(label);
  lines.push('');

  if (summary.projects.length === 0) {
    lines.push('No work logged in this range.');
  } else {
    for (const project of summary.projects) {
      lines.push(`${project.name} (${formatMinutes(project.minutes)})`);
      for (const task of project.tasks) {
        lines.push(`  ${task.title} — ${formatMinutes(task.minutes)}`);
      }
      lines.push('');
    }
  }

  lines.push(`Total: ${formatMinutes(summary.totalMinutes)}`);
  return lines.join('\n');
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const presetParam = searchParams.get('preset') ?? '';
  const format = searchParams.get('format') ?? 'text';

  if (!isTimeRangePreset(presetParam)) {
    return NextResponse.json({ error: 'Invalid preset' }, { status: 400 });
  }
  if (format !== 'text' && format !== 'pdf') {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  const range = presetRange(presetParam, {
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  });
  if (!range) {
    return NextResponse.json({ error: 'Missing custom range dates' }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id }, select: { name: true } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const projectId = searchParams.get('projectId') ?? undefined;
  const summary = await getClientTimeRangeSummary(id, range.from, range.to, projectId);
  const label = rangeLabel(presetParam, range.from, range.to);
  const filenameBase = `${slugify(client.name)}-${slugify(label)}`;

  if (format === 'pdf') {
    const buffer = await renderTimeReportPdf({ clientName: client.name, rangeLabel: label, summary });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
      },
    });
  }

  const text = buildTextReport(client.name, label, summary);
  return new NextResponse(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
