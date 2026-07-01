import { Receipt, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getAkauntingConfig } from '@/lib/akaunting';
import InvoicesClient from '@/components/admin/invoices/InvoicesClient';

export default async function InvoicesPage() {
  const [config, clients] = await Promise.all([
    getAkauntingConfig(),
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
          <Receipt size={22} />
        </span>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 600,
              fontSize: '25px',
              margin: 0,
              color: '#2E294E',
            }}
          >
            Invoices
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Courier New', monospace",
              fontSize: '12.5px',
              color: '#6b6580',
            }}
          >
            create invoices · synced to akaunting
          </p>
        </div>
        {config && (
          <a
            href={config.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: '#ffffff',
              color: '#2E294E',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '13.5px',
              padding: '9px 16px',
              border: '2px solid #2E294E',
              borderRadius: '6px',
              boxShadow: '3px 3px 0 0 #2E294E',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <ExternalLink size={14} />
            Open Akaunting
          </a>
        )}
      </div>

      <InvoicesClient connected={!!config} clients={clients} />
    </div>
  );
}
