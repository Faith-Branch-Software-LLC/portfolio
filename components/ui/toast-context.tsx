'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ToastVariant = 'default' | 'destructive';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, variant = 'default' }: { title: string; description?: string; variant?: ToastVariant }) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-2), { id, title, description, variant }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof window !== 'undefined' && toasts.length > 0 && createPortal(
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9000, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', width: 'calc(100vw - 40px)' }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: t.variant === 'destructive' ? '#D7263D' : '#ffffff',
                color: t.variant === 'destructive' ? '#ffffff' : '#2E294E',
                border: `2px solid ${t.variant === 'destructive' ? '#D7263D' : '#2E294E'}`,
                borderRadius: '10px',
                padding: '14px 16px',
                boxShadow: '5px 5px 0 0 rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '15px', marginBottom: t.description ? '4px' : 0 }}>{t.title}</div>
                {t.description && <div style={{ fontFamily: 'Gelasio, serif', fontSize: '13px', opacity: 0.85 }}>{t.description}</div>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, padding: 0, flexShrink: 0, marginTop: '1px' }}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  return useContext(ToastContext);
}
