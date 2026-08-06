'use client';

import { useState } from 'react';
import { ChemicalType, Pool } from '@prisma/client';
import { deletePool } from '@/lib/actions/admin/pools';
import { appleMapsDirectionsUrl } from '@/lib/pool-constants';
import { Droplets, Pencil, Trash2, Plus, FileBarChart, Navigation } from 'lucide-react';
import PoolForm from './PoolForm';
import AdminLink from '@/components/admin/AdminLink';
import { useAdminToast } from '@/components/ui/toast-context';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type PoolWithCount = Pool & { _count: { visits: number } };

interface PoolListProps {
  pools: PoolWithCount[];
}

const chemicalLabel: Record<ChemicalType, string> = {
  CHLORINE: 'Chlorine',
  SALT: 'Salt',
};

const chemicalColor: Record<ChemicalType, string> = {
  CHLORINE: '#1B998B',
  SALT: '#3498db',
};

export default function PoolList({ pools }: PoolListProps) {
  const { toast } = useAdminToast();
  const [editing, setEditing] = useState<Pool | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PoolWithCount | null>(null);

  const doDelete = async (pool: PoolWithCount) => {
    setDeletingId(pool.id);
    try {
      await deletePool(pool.id);
    } catch {
      toast({ title: 'Could not delete pool', variant: 'destructive' });
    }
    setDeletingId(null);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'clamp(14px, 4vw, 18px) clamp(14px, 4vw, 26px)',
            background: 'rgba(255,255,255,0.55)',
            borderBottom: '2px solid #2E294E',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '10px',
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
              Pool Cleaning
            </h1>
            <p
              style={{
                margin: '2px 0 0',
                fontFamily: "'Courier New', monospace",
                fontSize: '12.5px',
                color: '#6b6580',
              }}
            >
              {pools.length} pool{pools.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <AdminLink href="/admin/pools/reports">
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '44px',
                  background: '#fff',
                  color: '#2E294E',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '10px 15px',
                  border: '1.5px solid rgba(46,41,78,0.28)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <FileBarChart size={16} />
                <span className="hidden sm:inline">Reports</span>
              </button>
            </AdminLink>
            <button
              onClick={() => setCreating(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
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
              <Plus size={16} />
              <span className="hidden sm:inline">New pool</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-[24px_26px]" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
                New Pool
              </h2>
              <PoolForm onSuccess={() => setCreating(false)} onCancel={() => setCreating(false)} />
            </div>
          )}

          {pools.length === 0 && !creating ? (
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
              No pools yet. Add one to get started.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px',
              }}
            >
              {pools.map((pool) =>
                editing?.id === pool.id ? (
                  <div
                    key={pool.id}
                    style={{
                      background: '#fff',
                      border: '2px solid #2E294E',
                      borderRadius: '10px',
                      boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
                      padding: '20px',
                      gridColumn: '1 / -1',
                    }}
                  >
                    <PoolForm pool={pool} onSuccess={() => setEditing(null)} onCancel={() => setEditing(null)} />
                  </div>
                ) : (
                  <div
                    key={pool.id}
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
                    <div style={{ height: '4px', background: chemicalColor[pool.chemicalType], flexShrink: 0 }} />

                    <AdminLink href={`/admin/pools/${pool.id}`}>
                      <div style={{ padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'Fraunces, serif',
                              fontWeight: 600,
                              fontSize: '15px',
                              color: '#2E294E',
                              lineHeight: 1.3,
                            }}
                          >
                            {pool.name}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: "'Courier New', monospace",
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '20px',
                              background: `${chemicalColor[pool.chemicalType]}1a`,
                              color: chemicalColor[pool.chemicalType],
                              flexShrink: 0,
                            }}
                          >
                            <Droplets size={10} />
                            {chemicalLabel[pool.chemicalType]}
                          </span>
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '12.5px',
                            color: '#6b6580',
                          }}
                        >
                          {pool.address}
                        </div>
                        {pool.contactName && (
                          <div
                            style={{
                              fontFamily: "'Courier New', monospace",
                              fontSize: '11px',
                              color: '#8a8499',
                            }}
                          >
                            {pool.contactName}
                          </div>
                        )}
                        <div
                          style={{
                            fontFamily: "'Courier New', monospace",
                            fontSize: '11px',
                            color: '#8a8499',
                            marginTop: '2px',
                          }}
                        >
                          {pool._count.visits} visit{pool._count.visits !== 1 ? 's' : ''} logged
                        </div>
                      </div>
                    </AdminLink>

                    <div
                      style={{
                        borderTop: '1.5px solid rgba(46,41,78,0.1)',
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: 'auto',
                      }}
                    >
                      <a
                        href={appleMapsDirectionsUrl(pool.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Directions"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          minWidth: '40px',
                          minHeight: '40px',
                          flex: 1,
                          background: '#ffffff',
                          color: '#1B998B',
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: '12px',
                          border: '1.5px solid rgba(27,153,139,0.35)',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          textDecoration: 'none',
                        }}
                      >
                        <Navigation size={13} />
                        Directions
                      </a>
                      <button
                        onClick={() => setEditing(pool)}
                        title="Edit"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '40px',
                          minHeight: '40px',
                          background: '#ffffff',
                          color: '#2E294E',
                          border: '1.5px solid rgba(46,41,78,0.2)',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(pool)}
                        disabled={deletingId === pool.id}
                        title="Delete"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '40px',
                          minHeight: '40px',
                          background: '#ffffff',
                          color: '#D7263D',
                          border: '1.5px solid rgba(215,38,61,0.3)',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          opacity: deletingId === pool.id ? 0.5 : 1,
                        }}
                      >
                        <Trash2 size={14} />
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
          message={`Delete "${confirmDelete.name}"? This removes its checklist and visit history. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
