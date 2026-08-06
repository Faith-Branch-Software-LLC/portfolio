'use client';

import { useState } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { createVisit, updateVisit } from '@/lib/actions/admin/pools';
import { MIN_VISIT_MINUTES } from '@/lib/pool-constants';
import type { PoolChecklistItem } from '@prisma/client';
import type { PoolVisitWithDetails } from './PoolDetail';

interface ChemicalRow {
  name: string;
  amount: string;
}

interface VisitFormProps {
  poolId: string;
  checklistItems: PoolChecklistItem[];
  visit?: PoolVisitWithDetails;
  onSaved: (visit: PoolVisitWithDetails) => void;
  onCancel: () => void;
}

function toDateInputValue(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}

export default function VisitForm({ poolId, checklistItems, visit, onSaved, onCancel }: VisitFormProps) {
  const [date, setDate] = useState(visit ? toDateInputValue(visit.date) : toDateInputValue(new Date()));
  const [hours, setHours] = useState(String(Math.floor((visit?.minutes ?? MIN_VISIT_MINUTES) / 60)));
  const [mins, setMins] = useState(String((visit?.minutes ?? MIN_VISIT_MINUTES) % 60));
  const [notes, setNotes] = useState(visit?.notes ?? '');
  const [chemicals, setChemicals] = useState<ChemicalRow[]>(
    visit?.chemicals.map((c) => ({ name: c.name, amount: c.amount ?? '' })) ?? [{ name: '', amount: '' }],
  );
  const [checked, setChecked] = useState<Set<string>>(
    new Set(visit?.checklistChecks.map((c) => c.checklistItemId) ?? []),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(mins) || 0);

  const toggleChecked = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateChemical = (index: number, field: keyof ChemicalRow, value: string) => {
    setChemicals((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const removeChemical = (index: number) => {
    setChemicals((prev) => prev.filter((_, i) => i !== index));
  };

  const addChemical = () => {
    setChemicals((prev) => [...prev, { name: '', amount: '' }]);
  };

  const handleSave = async () => {
    setError('');
    if (totalMinutes < MIN_VISIT_MINUTES) {
      setError(`Visits must be logged for at least ${MIN_VISIT_MINUTES / 60} hours.`);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        poolId,
        date: new Date(`${date}T12:00:00`),
        minutes: totalMinutes,
        notes: notes || undefined,
        chemicals: chemicals.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), amount: c.amount.trim() || undefined })),
        checkedItemIds: Array.from(checked),
      };
      const saved = visit ? await updateVisit(visit.id, payload) : await createVisit(payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
    setSaving(false);
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: '11px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#8a8499',
    marginBottom: '7px',
  };

  const fieldWrapStyle: React.CSSProperties = {
    background: '#F7F3EA',
    border: '1.5px solid rgba(46,41,78,0.2)',
    borderRadius: '7px',
    padding: '11px 12px',
    minHeight: '44px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    color: '#2E294E',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  };

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.45)', zIndex: 60 }}
        onClick={onCancel}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 61,
          background: '#fff',
          border: '2px solid #2E294E',
          borderRadius: '12px',
          boxShadow: '8px 8px 0 0 rgba(0,0,0,0.22)',
          width: 'min(480px, 94vw)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88dvh',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: '#F4EAD4',
            borderBottom: '2px solid #2E294E',
            borderRadius: '10px 10px 0 0',
            flexShrink: 0,
          }}
        >
          <div
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '15px', color: '#2E294E' }}
          >
            {visit ? 'Edit Visit' : 'Log Visit'}
          </div>
          <button
            onClick={onCancel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: '#fff',
              border: '1.5px solid #2E294E',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#2E294E',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Date */}
          <div>
            <label style={labelStyle}>Date</label>
            <div style={fieldWrapStyle}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Hours */}
          <div>
            <label style={labelStyle}>Hours</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ ...fieldWrapStyle, flex: 1 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', color: '#8a8499', flexShrink: 0 }}>h</span>
              <div style={{ ...fieldWrapStyle, flex: 1 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={0}
                  max={59}
                  value={mins}
                  onChange={(e) => setMins(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center' }}
                />
              </div>
              <span style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', color: '#8a8499', flexShrink: 0 }}>m</span>
            </div>
          </div>

          {/* Checklist */}
          {checklistItems.length > 0 && (
            <div>
              <label style={labelStyle}>Checklist</label>
              <div
                style={{
                  border: '1.5px solid rgba(46,41,78,0.16)',
                  borderRadius: '7px',
                  overflow: 'hidden',
                }}
              >
                {checklistItems.map((item, i) => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '11px',
                      padding: '12px 12px',
                      minHeight: '46px',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      borderBottom: i < checklistItems.length - 1 ? '1px solid rgba(46,41,78,0.08)' : 'none',
                      background: checked.has(item.id) ? '#F7F3EA' : '#fff',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.id)}
                      onChange={() => toggleChecked(item.id)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#1B998B', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '15px',
                        color: checked.has(item.id) ? '#2E294E' : '#8a8499',
                      }}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Chemicals */}
          <div>
            <label style={labelStyle}>Chemicals used</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {chemicals.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ ...fieldWrapStyle, flex: 3, padding: '9px 10px' }}>
                    <input
                      placeholder="e.g. Chlorine tabs"
                      value={c.name}
                      onChange={(e) => updateChemical(i, 'name', e.target.value)}
                      style={{ ...inputStyle, fontSize: '15px' }}
                    />
                  </div>
                  <div style={{ ...fieldWrapStyle, flex: 2, padding: '9px 10px' }}>
                    <input
                      placeholder="Amount"
                      value={c.amount}
                      onChange={(e) => updateChemical(i, 'amount', e.target.value)}
                      style={{ ...inputStyle, fontSize: '15px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChemical(i)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '40px',
                      minHeight: '40px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#D7263D',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addChemical}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  alignSelf: 'flex-start',
                  minHeight: '40px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#2E294E',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '13.5px',
                  fontWeight: 600,
                  padding: '4px 4px',
                }}
              >
                <Plus size={15} /> Add chemical
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <div style={{ ...fieldWrapStyle, padding: 0 }}>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything worth remembering about this trip"
                style={{ ...inputStyle, padding: '10px 11px', resize: 'none', fontFamily: 'Gelasio, serif', lineHeight: 1.5 }}
              />
            </div>
          </div>

          {error && <p style={{ color: '#D7263D', fontSize: '13px', margin: 0 }}>{error}</p>}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '9px',
            padding: '14px 18px',
            borderTop: '2px solid #2E294E',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              minHeight: '46px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              padding: '9px 16px',
              background: '#fff',
              color: '#2E294E',
              border: '2px solid #2E294E',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              flex: 2,
              minHeight: '46px',
              background: '#1B998B',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: '14px',
              padding: '9px 16px',
              border: '2px solid #2E294E',
              borderRadius: '6px',
              boxShadow: '3px 3px 0 0 #2E294E',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Check size={16} />
            {visit ? 'Save' : 'Log visit'}
          </button>
        </div>
      </div>
    </>
  );
}
