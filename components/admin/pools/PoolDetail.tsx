'use client';

import { useState } from 'react';
import { ChevronLeft, Droplets, Pencil, Trash2, Plus, X, Check, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import AdminLink from '@/components/admin/AdminLink';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAdminToast } from '@/components/ui/toast-context';
import { appleMapsDirectionsUrl } from '@/lib/pool-constants';
import {
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  deletePool,
  deleteVisit,
  getPool,
} from '@/lib/actions/admin/pools';
import { ChemicalType, PoolChecklistItem } from '@prisma/client';
import PoolForm from './PoolForm';
import VisitForm from './VisitForm';

export type PoolWithDetails = NonNullable<Awaited<ReturnType<typeof getPool>>>;
export type PoolVisitWithDetails = PoolWithDetails['visits'][number];

const chemicalLabel: Record<ChemicalType, string> = { CHLORINE: 'Chlorine', SALT: 'Salt' };
const chemicalColor: Record<ChemicalType, string> = { CHLORINE: '#1B998B', SALT: '#3498db' };

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function ChecklistRow({
  item,
  onSave,
  onDelete,
}: {
  item: PoolChecklistItem;
  onSave: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);

  const save = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== item.label) onSave(item.id, trimmed);
    else setLabel(item.label);
    setEditing(false);
  };

  const iconButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
    minHeight: '36px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 6px 4px 12px',
        borderBottom: '1px solid rgba(46,41,78,0.08)',
        minHeight: '44px',
      }}
    >
      {editing ? (
        <>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            style={{
              flex: 1,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '16px',
              color: '#2E294E',
              background: '#F7F3EA',
              border: '1px solid rgba(46,41,78,0.25)',
              borderRadius: '5px',
              padding: '7px 8px',
              outline: 'none',
            }}
          />
          <button onClick={save} style={{ ...iconButtonStyle, color: '#1B998B' }}>
            <Check size={16} />
          </button>
          <button
            onClick={() => {
              setLabel(item.label);
              setEditing(false);
            }}
            style={{ ...iconButtonStyle, color: '#8a8499' }}
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#2E294E' }}>
            {item.label}
          </span>
          <button onClick={() => setEditing(true)} style={{ ...iconButtonStyle, color: '#8a8499' }}>
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(item.id)} style={{ ...iconButtonStyle, color: '#D7263D' }}>
            <Trash2 size={14} />
          </button>
        </>
      )}
    </div>
  );
}

function VisitRow({
  visit,
  checklistItems,
  onEdit,
  onDelete,
  defaultExpanded = false,
}: {
  visit: PoolVisitWithDetails;
  checklistItems: PoolChecklistItem[];
  onEdit: () => void;
  onDelete: () => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const dateLabel = new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const doneCount = visit.checklistChecks.length;

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #2E294E',
        borderRadius: '10px',
        boxShadow: '3px 3px 0 0 rgba(46,41,78,0.12)',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '10px 8px 10px 14px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '14px', color: '#2E294E', whiteSpace: 'nowrap' }}>
              {dateLabel}
            </span>
            <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: '13px', color: '#1B998B', whiteSpace: 'nowrap' }}>
              {formatHours(visit.minutes)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                minHeight: '36px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8a8499',
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                minHeight: '36px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#D7263D',
              }}
            >
              <Trash2 size={14} />
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '36px' }}>
              {expanded ? <ChevronUp size={16} style={{ color: '#8a8499' }} /> : <ChevronDown size={16} style={{ color: '#8a8499' }} />}
            </span>
          </div>
        </div>
        {(checklistItems.length > 0 || visit.chemicals.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {checklistItems.length > 0 && (
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#8a8499', whiteSpace: 'nowrap' }}>
                {doneCount}/{checklistItems.length} done
              </span>
            )}
            {visit.chemicals.length > 0 && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11.5px',
                  color: '#6b6580',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {visit.chemicals.map((c) => c.name).join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visit.notes && (
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13.5px', color: '#3b3550', margin: 0, lineHeight: 1.5 }}>
              {visit.notes}
            </p>
          )}
          {visit.chemicals.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {visit.chemicals.map((c) => (
                <span
                  key={c.id}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '11px',
                    color: '#2E294E',
                    background: '#F4EAD4',
                    border: '1px solid rgba(46,41,78,0.15)',
                    borderRadius: '20px',
                    padding: '3px 9px',
                  }}
                >
                  {c.name}{c.amount ? ` — ${c.amount}` : ''}
                </span>
              ))}
            </div>
          )}
          {checklistItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {checklistItems.map((item) => {
                const done = visit.checklistChecks.some((c) => c.checklistItemId === item.id);
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: done ? '#1B998B' : 'rgba(46,41,78,0.18)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12.5px',
                        color: done ? '#2E294E' : '#8a8499',
                        textDecoration: done ? 'none' : 'none',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PoolDetailProps {
  pool: PoolWithDetails;
}

export default function PoolDetail({ pool: initialPool }: PoolDetailProps) {
  const { toast } = useAdminToast();
  const [pool, setPool] = useState(initialPool);
  const [editingPool, setEditingPool] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [visitFormOpen, setVisitFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<PoolVisitWithDetails | null>(null);
  const [confirmDeleteVisit, setConfirmDeleteVisit] = useState<PoolVisitWithDetails | null>(null);
  const [confirmDeletePool, setConfirmDeletePool] = useState(false);

  const handleAddChecklistItem = async () => {
    const label = newItemLabel.trim();
    if (!label) return;
    setNewItemLabel('');
    const item = await createChecklistItem(pool.id, label);
    setPool((p) => ({ ...p, checklistItems: [...p.checklistItems, item] }));
  };

  const handleSaveChecklistItem = async (id: string, label: string) => {
    setPool((p) => ({ ...p, checklistItems: p.checklistItems.map((i) => (i.id === id ? { ...i, label } : i)) }));
    await updateChecklistItem(id, pool.id, label);
  };

  const handleDeleteChecklistItem = async (id: string) => {
    setPool((p) => ({ ...p, checklistItems: p.checklistItems.filter((i) => i.id !== id) }));
    await deleteChecklistItem(id, pool.id);
  };

  const handleVisitSaved = (visit: PoolVisitWithDetails) => {
    setPool((p) => {
      const exists = p.visits.some((v) => v.id === visit.id);
      const visits = exists ? p.visits.map((v) => (v.id === visit.id ? visit : v)) : [visit, ...p.visits];
      visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { ...p, visits };
    });
    setVisitFormOpen(false);
    setEditingVisit(null);
  };

  const handleDeleteVisit = async (visit: PoolVisitWithDetails) => {
    setPool((p) => ({ ...p, visits: p.visits.filter((v) => v.id !== visit.id) }));
    await deleteVisit(visit.id, pool.id);
  };

  const handleDeletePool = async () => {
    try {
      await deletePool(pool.id);
    } catch {
      toast({ title: 'Could not delete pool', variant: 'destructive' });
    }
  };

  const totalMinutes = pool.visits.reduce((sum, v) => sum + v.minutes, 0);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'clamp(10px, 3vw, 18px) clamp(14px, 4vw, 26px)',
            background: 'rgba(255,255,255,0.55)',
            borderBottom: '2px solid #2E294E',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <AdminLink href="/admin/pools">
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                minHeight: '40px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#6b6580',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '0 4px 0 0',
              }}
            >
              <ChevronLeft size={15} />
              Pools
            </button>
          </AdminLink>
          <span style={{ color: 'rgba(46,41,78,0.2)', fontSize: '16px' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'Fraunces, serif',
                fontWeight: 600,
                fontSize: 'clamp(18px, 5vw, 22px)',
                margin: 0,
                color: '#2E294E',
              }}
            >
              {pool.name}
            </h1>
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
          <button
            onClick={() => setEditingPool((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minHeight: '40px',
              background: '#fff',
              color: '#2E294E',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '12.5px',
              padding: '7px 11px',
              border: '1.5px solid rgba(46,41,78,0.28)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            onClick={() => setConfirmDeletePool(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px',
              background: '#fff',
              color: '#D7263D',
              border: '1.5px solid rgba(215,38,61,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Info strip */}
        <div
          style={{
            padding: '10px clamp(14px, 4vw, 26px)',
            background: '#F4EAD4',
            borderBottom: '1.5px solid rgba(46,41,78,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12.5px',
            color: '#6b6580',
          }}
        >
          <span>{pool.address}</span>
          <a
            href={appleMapsDirectionsUrl(pool.address)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              minHeight: '32px',
              padding: '4px 10px',
              background: '#fff',
              color: '#1B998B',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '12px',
              border: '1.5px solid rgba(27,153,139,0.35)',
              borderRadius: '20px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Navigation size={12} />
            Directions
          </a>
          {pool.contactName && (
            <>
              <span style={{ color: 'rgba(46,41,78,0.2)' }}>·</span>
              <span>{pool.contactName}</span>
            </>
          )}
          <span style={{ marginLeft: 'auto', fontFamily: "'Courier New', monospace", fontWeight: 700, color: '#2E294E' }}>
            {formatHours(totalMinutes)} total
          </span>
        </div>

        {editingPool && (
          <div style={{ padding: 'clamp(14px, 4vw, 18px) clamp(14px, 4vw, 26px)', borderBottom: '1.5px solid rgba(46,41,78,0.12)', background: '#fff' }}>
            <PoolForm
              pool={pool}
              onSuccess={(updated) => {
                setPool((p) => ({ ...p, ...updated }));
                setEditingPool(false);
              }}
              onCancel={() => setEditingPool(false)}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: 'clamp(14px, 4vw, 20px) clamp(14px, 4vw, 26px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div style={{ maxWidth: '720px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Visits */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '15px', color: '#2E294E', margin: 0 }}>
                  Visits
                </h2>
                <button
                  onClick={() => setVisitFormOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    minHeight: '44px',
                    background: '#F46036',
                    color: '#fff',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: '13px',
                    padding: '8px 16px',
                    border: '2px solid #2E294E',
                    borderRadius: '6px',
                    boxShadow: '2px 2px 0 0 #2E294E',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  Log visit
                </button>
              </div>

              {pool.visits.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: '#8a8499',
                    fontFamily: 'Gelasio, serif',
                    fontSize: '14px',
                    fontStyle: 'italic',
                  }}
                >
                  No visits logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pool.visits.map((visit, i) => (
                    <VisitRow
                      key={visit.id}
                      visit={visit}
                      checklistItems={pool.checklistItems}
                      onEdit={() => setEditingVisit(visit)}
                      onDelete={() => setConfirmDeleteVisit(visit)}
                      defaultExpanded={i === 0}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '15px', color: '#2E294E', margin: 0 }}>
                  Checklist
                </h2>
                <button
                  onClick={() => setEditingChecklist((v) => !v)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '36px',
                    background: editingChecklist ? '#2E294E' : '#fff',
                    color: editingChecklist ? '#fff' : '#2E294E',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: '12px',
                    padding: '6px 11px',
                    border: '1.5px solid rgba(46,41,78,0.28)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {editingChecklist ? <Check size={12} /> : <Pencil size={12} />}
                  {editingChecklist ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingChecklist && (
                <div
                  style={{
                    marginTop: '10px',
                    background: '#fff',
                    border: '2px solid #2E294E',
                    borderRadius: '10px',
                    boxShadow: '3px 3px 0 0 rgba(46,41,78,0.12)',
                    overflow: 'hidden',
                  }}
                >
                  {pool.checklistItems.map((item) => (
                    <ChecklistRow key={item.id} item={item} onSave={handleSaveChecklistItem} onDelete={handleDeleteChecklistItem} />
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px 4px 12px', minHeight: '44px' }}>
                    <input
                      value={newItemLabel}
                      onChange={(e) => setNewItemLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                      placeholder="Add checklist item…"
                      style={{
                        flex: 1,
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '16px',
                        color: '#2E294E',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleAddChecklistItem}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '36px',
                        minHeight: '36px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#1B998B',
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(visitFormOpen || editingVisit) && (
        <VisitForm
          poolId={pool.id}
          checklistItems={pool.checklistItems}
          visit={editingVisit ?? undefined}
          onSaved={handleVisitSaved}
          onCancel={() => {
            setVisitFormOpen(false);
            setEditingVisit(null);
          }}
        />
      )}

      {confirmDeleteVisit && (
        <ConfirmDialog
          message="Delete this visit? This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteVisit(confirmDeleteVisit)}
          onCancel={() => setConfirmDeleteVisit(null)}
        />
      )}

      {confirmDeletePool && (
        <ConfirmDialog
          message={`Delete "${pool.name}"? This removes its checklist and visit history. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDeletePool}
          onCancel={() => setConfirmDeletePool(false)}
        />
      )}
    </>
  );
}
