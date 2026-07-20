import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ReportsList from '@/components/admin/reports/ReportsList';
import TimeRangeSummary from '@/components/admin/reports/TimeRangeSummary';
import AdminLink from '@/components/admin/AdminLink';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientReportsPage({ params }: PageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      progressReports: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!client) notFound();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          padding: '18px 26px',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
        }}
      >
        <AdminLink href="/admin/clients">
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#6b6580',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <ChevronLeft size={15} />
            Clients
          </button>
        </AdminLink>
        <span style={{ color: 'rgba(46,41,78,0.2)', fontSize: '16px' }}>·</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '4px',
              background: client.color ?? '#888',
              display: 'inline-block',
            }}
          />
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600,
              fontSize: '22px',
              margin: 0,
              color: '#2E294E',
            }}
          >
            {client.name} — Reports
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 26px' }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{ marginBottom: '24px' }}>
            <TimeRangeSummary clientId={client.id} />
          </div>
          <ReportsList
            clientId={client.id}
            clientName={client.name}
            clientColor={client.color}
            initialReports={client.progressReports}
          />
        </div>
      </div>
    </div>
  );
}
