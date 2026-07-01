'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Trash2, ExternalLink, X, Download } from 'lucide-react';
import { useAdminToast } from '@/components/ui/toast-context';
import type { AkauntingInvoice } from '@/lib/akaunting';

interface Client {
  id: string;
  name: string;
  color: string | null;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface Props {
  connected: boolean;
  clients: Client[];
}

// ─── styles ──────────────────────────────────────────────────────────────────

const panel = {
  background: '#ffffff',
  border: '2px solid #2E294E',
  borderRadius: '10px',
  boxShadow: '5px 5px 0 0 rgba(46,41,78,0.18)',
  padding: '22px 24px',
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  fontFamily: "'Courier New', monospace",
  fontSize: '13px',
  border: '1.5px solid rgba(46,41,78,0.3)',
  borderRadius: '6px',
  background: '#F7F3EA',
  color: '#2E294E',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '12.5px',
  fontWeight: 600 as const,
  color: '#2E294E',
  display: 'block' as const,
  marginBottom: '5px',
};

const btnPrimary = (color = '#1B998B') => ({
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: '7px',
  background: color,
  color: '#fff',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600 as const,
  fontSize: '13.5px',
  padding: '9px 16px',
  border: '2px solid #2E294E',
  borderRadius: '6px',
  boxShadow: '3px 3px 0 0 #2E294E',
  cursor: 'pointer' as const,
});

const btnOutline = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: '7px',
  background: '#fff',
  color: '#2E294E',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600 as const,
  fontSize: '13.5px',
  padding: '9px 16px',
  border: '2px solid #2E294E',
  borderRadius: '6px',
  boxShadow: '3px 3px 0 0 #2E294E',
  cursor: 'pointer' as const,
};

const btnSmall = (color = '#2E294E') => ({
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  gap: '5px',
  background: 'transparent',
  color,
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600 as const,
  fontSize: '12.5px',
  padding: '6px 10px',
  border: `1.5px solid ${color}`,
  borderRadius: '5px',
  cursor: 'pointer' as const,
});

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    draft: { bg: '#f0eeff', color: '#6b6580', border: '#c8c3e0' },
    sent: { bg: '#fff8dc', color: '#8b6914', border: '#dfc255' },
    partial: { bg: '#e8f4ff', color: '#1a5fa8', border: '#6bb0f5' },
    paid: { bg: '#d4f7f0', color: '#0d7a68', border: '#1B998B' },
    overdue: { bg: '#ffe8e8', color: '#c0392b', border: '#e74c3c' },
    cancelled: { bg: '#f5f5f5', color: '#999', border: '#ccc' },
  };
  const s = colors[status] ?? colors.draft;
  return (
    <span style={{ padding: '2px 9px', borderRadius: '20px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: "'DM Sans', sans-serif", fontSize: '11.5px', fontWeight: 600, textTransform: 'capitalize' as const }}>
      {status}
    </span>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function InvoicesClient({ connected, clients }: Props) {
  const { toast } = useAdminToast();
  const [invoices, setInvoices] = useState<AkauntingInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // ── create form state ─────────────────────────────────────────────────────
  const [selectedClient, setSelectedClient] = useState('');
  const [issuedAt, setIssuedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', quantity: 1, price: 0 }]);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  // ── receipt state ─────────────────────────────────────────────────────────
  const [fetchingReceipt, setFetchingReceipt] = useState<number | null>(null);

  const loadInvoices = useCallback(async (p = 1) => {
    if (!connected) return;
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`/api/integrations/accounting/invoices?page=${p}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setErr(d.error ?? 'Failed to load invoices');
        return;
      }
      const data = await res.json() as { data: AkauntingInvoice[]; total: number };
      setInvoices(data.data);
      setTotal(data.total);
      setPage(p);
    } catch {
      setErr('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [connected]);

  useEffect(() => { loadInvoices(1); }, [loadInvoices]);

  async function handleReceiptClick(invoice: AkauntingInvoice) {
    setFetchingReceipt(invoice.id);
    try {
      let paidAt = new Date().toISOString().slice(0, 10);
      try {
        const res = await fetch(`/api/integrations/accounting/invoices/${invoice.id}`);
        if (res.ok) {
          const detail = await res.json() as { paid_at?: string | null; transactions?: { paid_at: string }[] };
          const maxTxDate = detail.transactions?.length
            ? detail.transactions.reduce((max, t) => t.paid_at > max ? t.paid_at : max, detail.transactions[0].paid_at)
            : null;
          const fromAkaunting = detail.paid_at ?? maxTxDate;
          if (fromAkaunting) paidAt = fromAkaunting.slice(0, 10);
        }
      } catch { /* use today fallback */ }

      const url = `/api/integrations/accounting/invoices/${invoice.id}/receipt?paidAt=${encodeURIComponent(paidAt)}`;
      const pdfRes = await fetch(url);
      if (!pdfRes.ok) {
        const d = await pdfRes.json().catch(() => ({})) as { error?: string };
        toast({ title: d.error ?? 'Failed to generate receipt' });
        return;
      }
      const blob = await pdfRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `receipt-${invoice.document_number || invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast({ title: 'Failed to generate receipt' });
    } finally {
      setFetchingReceipt(null);
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { name: '', quantity: 1, price: 0 }]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof InvoiceItem, value: string | number) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  async function createInvoice() {
    if (!selectedClient) { setCreateErr('Select a client'); return; }
    const validItems = items.filter((i) => i.name.trim());
    if (!validItems.length) { setCreateErr('Add at least one line item'); return; }

    const client = clients.find((c) => c.id === selectedClient);
    if (!client) return;

    setCreating(true);
    setCreateErr('');
    try {
      const res = await fetch('/api/integrations/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: client.name,
          issuedAt,
          dueAt,
          items: validItems,
          notes,
          currencyCode: currency,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setCreateErr(d.error ?? 'Failed to create invoice');
        return;
      }
      toast({ title: 'Invoice created in Akaunting' });
      setShowCreate(false);
      setSelectedClient('');
      setItems([{ name: '', quantity: 1, price: 0 }]);
      setNotes('');
      loadInvoices(1);
    } catch {
      setCreateErr('Failed to create invoice');
    } finally {
      setCreating(false);
    }
  }

  const totalPages = Math.ceil(total / 25);
  const formatCurrency = (amount: number, code: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount);

  if (!connected) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ ...panel, maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#2E294E', margin: '0 0 10px' }}>
            Akaunting not connected
          </p>
          <p style={{ fontFamily: 'Gelasio, serif', fontSize: '13.5px', color: '#6b6580', lineHeight: 1.6, margin: '0 0 18px' }}>
            Connect your Akaunting server in{' '}
            <a href="/admin/connections" style={{ color: '#1B998B', fontWeight: 600 }}>Connections</a> to start creating invoices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 26px' }}>
      <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── actions bar ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#6b6580' }}>
            {total > 0 ? `${total} invoice${total !== 1 ? 's' : ''} in Akaunting` : 'No invoices yet'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ ...btnOutline, fontSize: '13px', padding: '8px 14px' }} onClick={() => loadInvoices(page)} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
              Refresh
            </button>
            <button style={btnPrimary()} onClick={() => setShowCreate(true)}>
              <Plus size={14} /> New Invoice
            </button>
          </div>
        </div>

        {err && (
          <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', margin: 0 }}>{err}</p>
        )}

        {/* ── invoice list ───────────────────────────────────────────────── */}
        {invoices.length > 0 ? (
          <div style={{ ...panel, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2E294E' }}>
                  {['Number', 'Client', 'Issued', 'Due', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 700, color: '#6b6580', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid rgba(46,41,78,0.08)' : 'none', background: i % 2 === 0 ? '#fff' : '#FDFAF4' }}>
                    <td style={{ padding: '12px 16px', fontFamily: "'Courier New', monospace", fontSize: '12.5px', color: '#2E294E', fontWeight: 600 }}>{inv.document_number || `#${inv.id}`}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#2E294E' }}>{inv.contact_name}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6b6580' }}>{inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6b6580' }}>{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "'Courier New', monospace", fontSize: '13px', color: '#2E294E', fontWeight: 600 }}>{formatCurrency(inv.amount, inv.currency_code)}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={inv.status} /></td>
                    <td style={{ padding: '8px 16px' }}>
                      {inv.status === 'paid' && (
                        <button
                          style={btnSmall()}
                          onClick={() => handleReceiptClick(inv)}
                          disabled={downloading === inv.id || fetchingReceipt === inv.id}
                          title="Download receipt PDF"
                        >
                          {downloading === inv.id || fetchingReceipt === inv.id
                            ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Download size={12} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading ? (
          <div style={{ ...panel, textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontFamily: 'Gelasio, serif', fontSize: '14px', color: '#9990b0', margin: 0 }}>
              No invoices found. Create your first one above.
            </p>
          </div>
        ) : (
          <div style={{ ...panel, textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#9990b0', margin: 0 }}>Loading…</p>
          </div>
        )}

        {/* pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <button style={btnSmall()} disabled={page <= 1} onClick={() => loadInvoices(page - 1)}>← Prev</button>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: '#6b6580' }}>Page {page} of {totalPages}</span>
            <button style={btnSmall()} disabled={page >= totalPages} onClick={() => loadInvoices(page + 1)}>Next →</button>
          </div>
        )}
      </div>


      {/* ── create invoice modal ──────────────────────────────────────────── */}
      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(46,41,78,0.45)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 61, background: '#F4EAD4', border: '2px solid #2E294E', borderRadius: '12px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.25)', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1.5px solid rgba(46,41,78,0.15)' }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '18px', color: '#2E294E' }}>New Invoice</span>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6580', padding: '4px', display: 'flex' }}><X size={18} /></button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <div>
                  <label style={labelStyle}>Client</label>
                  <select style={inputStyle} value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                    <option value="">Select client…</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Issue Date</label>
                    <input style={inputStyle} type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Due Date</label>
                    <input style={inputStyle} type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                  </div>
                  <div style={{ width: '90px' }}>
                    <label style={labelStyle}>Currency</label>
                    <input style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} placeholder="USD" />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Line Items</label>
                    <button style={btnSmall()} onClick={addItem}><Plus size={12} /> Add item</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          style={{ ...inputStyle, flex: 3 }}
                          placeholder="Description"
                          value={item.name}
                          onChange={(e) => updateItem(i, 'name', e.target.value)}
                        />
                        <input
                          style={{ ...inputStyle, flex: 1 }}
                          type="number"
                          placeholder="Qty"
                          min="0"
                          step="0.5"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                        <input
                          style={{ ...inputStyle, flex: 1 }}
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                        />
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', padding: '4px', flexShrink: 0, display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <span style={{ fontFamily: "'Courier New', monospace", fontSize: '13px', fontWeight: 700, color: '#2E294E' }}>
                      Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(
                        items.reduce((sum, item) => sum + item.quantity * item.price, 0)
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea
                    style={{ ...inputStyle, height: '70px', resize: 'vertical' as const }}
                    placeholder="Thank you for your business!"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {createErr && <p style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', margin: 0 }}>{createErr}</p>}
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1.5px solid rgba(46,41,78,0.15)', display: 'flex', gap: '10px' }}>
              <button style={btnPrimary()} disabled={creating} onClick={createInvoice}>
                {creating ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><ExternalLink size={13} /> Create in Akaunting</>}
              </button>
              <button style={{ ...btnOutline, padding: '9px 14px' }} onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
