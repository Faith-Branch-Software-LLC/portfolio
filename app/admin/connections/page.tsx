import { Plug } from 'lucide-react';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import ConnectionsClient from '@/components/admin/connections/ConnectionsClient';

export default async function ConnectionsPage() {
  const [basecampIntegration, testflightIntegration, projects, clients] = await Promise.all([
    prisma.integration.findUnique({ where: { type: IntegrationType.BASECAMP } }),
    prisma.integration.findUnique({ where: { type: IntegrationType.TESTFLIGHT } }),
    prisma.project.findMany({
      where: { archived: false },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        basecampProjectId: true,
        basecampTodolistId: true,
        client: { select: { name: true, color: true } },
      },
    }),
    prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, color: true } }),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        <span style={{ color: '#2E294E', display: 'inline-flex' }}>
          <Plug size={22} />
        </span>
        <div>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600,
              fontSize: '25px',
              margin: 0,
              color: '#2E294E',
            }}
          >
            Connections
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Courier New', monospace",
              fontSize: '12.5px',
              color: '#6b6580',
            }}
          >
            sync projects and feedback into the workshop
          </p>
        </div>
      </div>

      <ConnectionsClient
        basecampConnected={!!basecampIntegration}
        basecampLastSync={basecampIntegration?.lastSyncedAt?.toISOString() ?? null}
        testflightConnected={!!testflightIntegration}
        testflightLastSync={testflightIntegration?.lastSyncedAt?.toISOString() ?? null}
        testflightTargetProjectId={
          testflightIntegration
            ? (testflightIntegration.config as { targetProjectId?: string }).targetProjectId ?? null
            : null
        }
        projects={projects}
        clients={clients}
      />
    </div>
  );
}
