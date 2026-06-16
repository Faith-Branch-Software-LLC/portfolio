'use client';

import { useState } from 'react';
import { Client } from '@prisma/client';
import { deleteClient } from '@/lib/actions/admin/clients';
import { Plus, FileText, Pencil, Trash2, UserPlus } from 'lucide-react';
import ClientForm from './ClientForm';
import AdminLink from '@/components/admin/AdminLink';

interface ClientListProps {
  clients: (Client & { _count: { projects: number } })[];
}

export default function ClientList({ clients }: ClientListProps) {
  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (client: Client & { _count: { projects: number } }) => {
    if (client._count.projects > 0) {
      alert(
        `"${client.name}" has ${client._count.projects} project(s). Reassign or delete them first.`,
      );
      return;
    }
    if (!confirm(`Delete "${client.name}"?`)) return;
    setDeletingId(client.id);
    await deleteClient(client.id);
    setDeletingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header bar */}
      <div
        className="px-4 sm:px-[26px]"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 26px',
          background: 'rgba(255,255,255,0.55)',
          borderBottom: '2px solid #2E294E',
          flexShrink: 0,
        }}
      >
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
            Clients
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: "'Courier New', monospace",
              fontSize: '12.5px',
              color: '#6b6580',
            }}
          >
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F46036',
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 15px',
            border: '2px solid #2E294E',
            borderRadius: '6px',
            boxShadow: '3px 3px 0 0 #2E294E',
            cursor: 'pointer',
          }}
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">New client</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-[24px_26px]" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* New client form */}
        {creating && (
          <div
            style={{
              background: '#fff',
              border: '2px solid #2E294E',
              borderRadius: '10px',
              boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
              padding: '22px',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 600,
                fontSize: '17px',
                margin: '0 0 16px',
                color: '#2E294E',
              }}
            >
              New Client
            </h2>
            <ClientForm
              onSuccess={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {clients.length === 0 && !creating ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 0',
              color: '#8a8499',
              fontFamily: 'Gelasio, serif',
              fontSize: '15px',
              fontStyle: 'italic',
            }}
          >
            No clients yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {clients.map((client) =>
              editing?.id === client.id ? (
                <div
                  key={client.id}
                  style={{
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '10px',
                    boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
                    padding: '22px',
                  }}
                >
                  <ClientForm
                    client={client}
                    onSuccess={() => setEditing(null)}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <div
                  key={client.id}
                  style={{
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '8px',
                    boxShadow: '4px 4px 0 0 rgba(46,41,78,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                  }}
                >
                  {/* Color swatch */}
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '6px',
                      background: client.color ?? '#888',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />

                  {/* Info + actions wrapper */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                    {/* Client info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'Fraunces, serif',
                          fontWeight: 600,
                          fontSize: '16px',
                          color: '#2E294E',
                        }}
                      >
                        {client.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: '11.5px',
                          color: '#8a8499',
                          marginTop: '2px',
                        }}
                      >
                        {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <AdminLink href={`/admin/clients/${client.id}/reports`}>
                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ffffff',
                            color: '#2E294E',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: '13px',
                            padding: '8px 12px',
                            border: '1.5px solid rgba(46,41,78,0.28)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <FileText size={14} />
                          <span className="hidden sm:inline">Reports</span>
                        </button>
                      </AdminLink>

                      <button
                        onClick={() => setEditing(client)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ffffff',
                          color: '#2E294E',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '13px',
                          padding: '8px 12px',
                          border: '1.5px solid rgba(46,41,78,0.28)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Pencil size={14} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDelete(client)}
                        disabled={deletingId === client.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ffffff',
                          color: '#D7263D',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '13px',
                          padding: '8px 12px',
                          border: '1.5px solid rgba(215,38,61,0.4)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          opacity: deletingId === client.id ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
