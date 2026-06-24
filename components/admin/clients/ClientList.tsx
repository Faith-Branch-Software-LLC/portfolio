'use client';

import { useState } from 'react';
import { Client } from '@prisma/client';
import { deleteClient } from '@/lib/actions/admin/clients';
import { FileText, Pencil, Trash2, UserPlus, ArrowUpDown, Clock } from 'lucide-react';
import ClientForm from './ClientForm';
import AdminLink from '@/components/admin/AdminLink';
import { useAdminToast } from '@/components/ui/toast-context';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type ClientWithCount = Client & { _count: { projects: number } };

interface ClientListProps {
  clients: ClientWithCount[];
}

type SortKey = 'name' | 'projects';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'projects', label: 'Projects' },
];

function sortClients(clients: ClientWithCount[], key: SortKey): ClientWithCount[] {
  return [...clients].sort((a, b) => {
    if (key === 'projects') return b._count.projects - a._count.projects;
    return a.name.localeCompare(b.name);
  });
}

export default function ClientList({ clients }: ClientListProps) {
  const { toast } = useAdminToast();
  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClientWithCount | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    if (typeof window === 'undefined') return 'name';
    return (localStorage.getItem('clients:sortKey') as SortKey) ?? 'name';
  });

  function handleSortChange(key: SortKey) {
    setSortKey(key);
    localStorage.setItem('clients:sortKey', key);
  }

  const handleDelete = async (client: ClientWithCount) => {
    if (client._count.projects > 0) {
      toast({ title: 'Cannot delete', description: `"${client.name}" has ${client._count.projects} project(s). Reassign or delete them first.`, variant: 'destructive' });
      return;
    }
    setConfirmDelete(client);
  };

  const doDelete = async (client: ClientWithCount) => {
    setDeletingId(client.id);
    await deleteClient(client.id);
    setDeletingId(null);
  };

  const visible = sortClients(clients, sortKey);

  return (
    <>
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={13} style={{ color: '#6b6580', flexShrink: 0 }} />
            <select
              value={sortKey}
              onChange={(e) => handleSortChange(e.target.value as SortKey)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '13px',
                color: '#2E294E',
                background: '#fff',
                border: '1.5px solid rgba(46,41,78,0.28)',
                borderRadius: '6px',
                padding: '7px 10px',
                cursor: 'pointer',
                appearance: 'none',
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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
              marginBottom: '20px',
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
            <ClientForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} />
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {visible.map((client) =>
              editing?.id === client.id ? (
                <div
                  key={client.id}
                  style={{
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '10px',
                    boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
                    padding: '20px',
                    gridColumn: '1 / -1',
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
                    boxShadow: '3px 3px 0 0 rgba(46,41,78,0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top color bar */}
                  <div style={{ height: '4px', background: client.color ?? '#888', flexShrink: 0 }} />

                  {/* Card body */}
                  <div style={{ padding: '14px 14px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '4px',
                          background: client.color ?? '#888',
                          flexShrink: 0,
                          display: 'inline-block',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'Fraunces, serif',
                          fontWeight: 600,
                          fontSize: '15px',
                          color: '#2E294E',
                          lineHeight: 1.3,
                        }}
                      >
                        {client.name}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: '11px',
                        color: '#8a8499',
                        marginTop: '2px',
                      }}
                    >
                      {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Card footer — actions */}
                  <div
                    style={{
                      borderTop: '1.5px solid rgba(46,41,78,0.1)',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                      <AdminLink href={`/admin/clients/${client.id}/reports`} className="flex-1">
                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#2E294E',
                            color: '#fff',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: '12px',
                            padding: '6px 10px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            width: '100%',
                            justifyContent: 'center',
                          }}
                        >
                          <FileText size={13} />
                          Reports
                        </button>
                      </AdminLink>
                      <AdminLink href={`/admin/clients/${client.id}/time`}>
                        <button
                          title="Time tracking"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            background: '#1B998B',
                            color: '#fff',
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            fontSize: '12px',
                            padding: '6px 9px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                          }}
                        >
                          <Clock size={13} />
                        </button>
                      </AdminLink>
                    </div>

                    <button
                      onClick={() => setEditing(client)}
                      title="Edit"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        color: '#2E294E',
                        padding: '6px 8px',
                        border: '1.5px solid rgba(46,41,78,0.2)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      onClick={() => handleDelete(client)}
                      disabled={deletingId === client.id}
                      title="Delete"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        color: '#D7263D',
                        padding: '6px 8px',
                        border: '1.5px solid rgba(215,38,61,0.3)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        opacity: deletingId === client.id ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>

    {confirmDelete && (
      <ConfirmDialog
        message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => doDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    )}
    </>
  );
}
