'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Client } from '@prisma/client';
import { deleteClient } from '@/lib/actions/admin/clients';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, FileText } from 'lucide-react';
import ClientForm from './ClientForm';

interface ClientListProps {
  clients: (Client & { _count: { projects: number } })[];
}

export default function ClientList({ clients }: ClientListProps) {
  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (client: Client & { _count: { projects: number } }) => {
    if (client._count.projects > 0) {
      alert(`"${client.name}" has ${client._count.projects} project(s). Reassign or delete them first.`);
      return;
    }
    if (!confirm(`Delete "${client.name}"?`)) return;
    setDeletingId(client.id);
    await deleteClient(client.id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-fraunces font-semibold">Clients</h1>
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      {creating && (
        <div className="bg-white rounded-xl border border-black/10 p-6">
          <h2 className="font-semibold mb-4">New Client</h2>
          <ClientForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} />
        </div>
      )}

      {clients.length === 0 && !creating ? (
        <div className="text-center py-16 text-gray-400">
          No clients yet. Create one to get started.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-black/10 divide-y divide-black/5">
          {clients.map((client) =>
            editing?.id === client.id ? (
              <div key={client.id} className="p-6">
                <ClientForm
                  client={client}
                  onSuccess={() => setEditing(null)}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div key={client.id} className="flex items-center gap-4 px-6 py-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: client.color ?? '#888888' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-gray-400">
                    {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/clients/${client.id}/reports`} title="Reports">
                      <FileText className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(client)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(client)}
                    disabled={deletingId === client.id}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
