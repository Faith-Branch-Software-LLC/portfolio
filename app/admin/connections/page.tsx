import { Plug } from 'lucide-react';
import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import ConnectionsClient from '@/components/admin/connections/ConnectionsClient';
import { getMcpApiKey } from '@/lib/actions/admin/integrations';
import { getAkauntingConfig } from '@/lib/akaunting';

export default async function ConnectionsPage() {
  const [basecampIntegration, testflightIntegrations, googleCalIntegrations, appleCalIntegrations, projects, clients, mcpApiKey, akauntingConfig] = await Promise.all([
    prisma.integration.findFirst({ where: { type: IntegrationType.BASECAMP } }),
    prisma.integration.findMany({ where: { type: IntegrationType.TESTFLIGHT }, orderBy: { createdAt: 'asc' } }),
    prisma.integration.findMany({ where: { type: IntegrationType.GOOGLE_CALENDAR }, orderBy: { createdAt: 'asc' } }),
    prisma.integration.findMany({ where: { type: IntegrationType.APPLE_CALENDAR }, orderBy: { createdAt: 'asc' } }),
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
    getMcpApiKey(),
    getAkauntingConfig(),
  ]);

  function toRow(i: { id: string; name: string; lastSyncedAt: Date | null; config: unknown }) {
    return { id: i.id, name: i.name, lastSyncedAt: i.lastSyncedAt?.toISOString() ?? null };
  }

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
            sync projects, feedback, and calendars into the workshop
          </p>
        </div>
      </div>

      <ConnectionsClient
        basecampConnected={!!basecampIntegration}
        basecampLastSync={basecampIntegration?.lastSyncedAt?.toISOString() ?? null}
        testflightIntegrations={testflightIntegrations.map(toRow)}
        googleCalIntegrations={googleCalIntegrations.map(toRow)}
        appleCalIntegrations={appleCalIntegrations.map(toRow)}
        projects={projects}
        clients={clients}
        mcpApiKey={mcpApiKey}
        akauntingConnected={!!akauntingConfig}
        akauntingUrl={akauntingConfig?.url ?? null}
      />
    </div>
  );
}
