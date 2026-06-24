'use client';

import { X } from 'lucide-react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }: ConfirmDialogProps) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.35)', zIndex: 200 }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 201,
          background: '#F4EAD4',
          border: '2px solid #2E294E',
          borderRadius: '12px',
          boxShadow: '8px 8px 0 0 rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: '380px',
          padding: '24px 24px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
          <p style={{ fontFamily: 'Gelasio, serif', fontSize: '15px', color: '#2E294E', margin: 0, lineHeight: 1.5 }}>{message}</p>
          <button
            onClick={onCancel}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: '#fff', border: '1.5px solid #2E294E', borderRadius: '6px', cursor: 'pointer', color: '#2E294E', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13.5px', padding: '8px 16px', background: '#fff', color: '#2E294E', border: '2px solid #2E294E', borderRadius: '6px', boxShadow: '2px 2px 0 0 #2E294E', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13.5px', padding: '8px 16px', background: danger ? '#D7263D' : '#2E294E', color: '#fff', border: `2px solid ${danger ? '#D7263D' : '#2E294E'}`, borderRadius: '6px', boxShadow: `2px 2px 0 0 ${danger ? '#D7263D' : '#2E294E'}`, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
