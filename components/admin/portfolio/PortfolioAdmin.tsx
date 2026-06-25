'use client';

import { useState, useTransition, useRef } from 'react';
import type { PortfolioItem } from '@prisma/client';
import Image from 'next/image';
import { Plus, Pencil, Trash2, X, Upload, GripVertical, ExternalLink, Loader2 } from 'lucide-react';
import { createPortfolioItem, updatePortfolioItem, deletePortfolioItem, reorderPortfolioItems } from '@/lib/actions/admin/portfolio';
import { useToast } from '@/components/ui/use-toast';

const TAPE_COLORS = ['Orange', 'Purple', 'Teal', 'Red'];

// Matches the public page: even index = teal, odd index = red
const BG_TEAL = '#1B998B';
const BG_RED = '#D7263D';
const bgColor = (idx: number) => idx % 2 === 0 ? BG_TEAL : BG_RED;
const bgLabel = (idx: number) => idx % 2 === 0 ? 'Teal' : 'Red';

type ItemData = {
  title: string;
  description: string;
  url: string;
  images: string[];
  noteRot: number;
  tapeColor: string;
};

const emptyForm = (): ItemData => ({
  title: '',
  description: '',
  url: '',
  images: [],
  noteRot: 0,
  tapeColor: 'Orange',
});

export default function PortfolioAdmin({ items: initial }: { items: PortfolioItem[] }) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ItemData>(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const openCreate = () => { setForm(emptyForm()); setCreating(true); setEditing(null); };
  const openEdit = (item: PortfolioItem) => {
    setForm({
      title: item.title,
      description: item.description,
      url: item.url,
      images: (item.images as string[]) ?? [],
      noteRot: item.noteRot,
      tapeColor: item.tapeColor,
    });
    setEditing(item.id);
    setCreating(false);
  };
  const closeForm = () => { setCreating(false); setEditing(null); };

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/portfolio/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json();
        urls.push(url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        if (creating) {
          const item = await createPortfolioItem(form);
          setItems((prev) => [...prev, item as PortfolioItem]);
          toast({ title: 'Item created' });
        } else if (editing) {
          const item = await updatePortfolioItem(editing, form);
          setItems((prev) => prev.map((p) => (p.id === editing ? (item as PortfolioItem) : p)));
          toast({ title: 'Item updated' });
        }
        closeForm();
      } catch {
        toast({ title: 'Save failed', variant: 'destructive' });
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deletePortfolioItem(id);
        setItems((prev) => prev.filter((p) => p.id !== id));
        toast({ title: 'Item deleted' });
      } catch {
        toast({ title: 'Delete failed', variant: 'destructive' });
      }
    });
  };

  const dragItem = useRef<number | null>(null);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (id: string) => { setDragOver(id); };
  const handleDrop = (targetIdx: number) => {
    const from = dragItem.current;
    if (from === null || from === targetIdx) { setDragOver(null); return; }
    const reordered = [...items];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(targetIdx, 0, moved);
    setItems(reordered);
    setDragOver(null);
    dragItem.current = null;
    startTransition(() => reorderPortfolioItems(reordered.map((i) => i.id)));
  };

  const showForm = creating || editing !== null;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
            Portfolio
          </h1>
          <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: '13px', marginTop: '4px' }}>
            {items.length} item{items.length !== 1 ? 's' : ''} — drag to reorder · colors alternate automatically
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: '#2E294E', color: '#fff', border: 'none',
            borderRadius: '7px', padding: '10px 16px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600,
          }}
        >
          <Plus size={16} /> Add item
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div style={{
          background: '#F4EAD4', borderRadius: '10px', padding: '24px',
          marginBottom: '28px', boxShadow: '4px 4px 0 rgba(0,0,0,0.12)',
          border: '1.5px solid rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {creating ? 'New item' : 'Edit item'}
            </h2>
            <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Title">
              <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="URL">
              <input style={inputStyle} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://" />
            </Field>
          </div>

          <Field label="Description" style={{ marginTop: '14px' }}>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
            <Field label="Tape color">
              <select style={inputStyle} value={form.tapeColor} onChange={(e) => setForm((f) => ({ ...f, tapeColor: e.target.value }))}>
                {TAPE_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Note rotation">
              <input style={inputStyle} type="number" step="0.1" value={form.noteRot}
                onChange={(e) => setForm((f) => ({ ...f, noteRot: parseFloat(e.target.value) || 0 }))} />
            </Field>
          </div>

          {/* Images */}
          <div style={{ marginTop: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Images
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {form.images.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: '90px', height: '120px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={url} alt={`image ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="90px" />
                  <button
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute', top: '4px', right: '4px',
                      background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
                      borderRadius: '50%', width: '20px', height: '20px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  width: '90px', height: '120px', border: '2px dashed rgba(0,0,0,0.2)',
                  borderRadius: '6px', background: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', color: '#777', fontSize: '12px', flexShrink: 0,
                }}
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                {uploading ? 'Uploading…' : 'Add image'}
              </button>
              <input
                ref={fileRef} type="file" accept="image/*" multiple hidden
                onChange={(e) => e.target.files && uploadImages(e.target.files)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
            <button onClick={closeForm} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleSave} disabled={isPending || uploading} style={saveBtnStyle}>
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888', fontFamily: 'Fraunces, serif', fontSize: '16px' }}>
            No portfolio items yet. Add one above.
          </div>
        )}
        {items.map((item, idx) => {
          const images = (item.images as string[]) ?? [];
          const color = bgColor(idx);
          const label = bgLabel(idx);
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => setDragOver(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: dragOver === item.id ? '#e8dfc8' : '#faf7f0',
                borderRadius: '8px', padding: '14px 16px',
                border: `1.5px solid ${dragOver === item.id ? '#c8bfa0' : 'rgba(0,0,0,0.07)'}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'background 0.15s, border-color 0.15s',
                cursor: 'grab',
              }}
            >
              <GripVertical size={18} style={{ color: '#bbb', flexShrink: 0 }} />

              {/* Background color swatch — matches live position */}
              <div style={{
                width: '10px', alignSelf: 'stretch', borderRadius: '3px',
                background: color, flexShrink: 0, opacity: 0.85,
              }} />

              {images[0] ? (
                <div style={{ width: '52px', height: '68px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={images[0]} alt={item.title} width={52} height={68} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                </div>
              ) : (
                <div style={{
                  width: '52px', height: '68px', borderRadius: '4px', flexShrink: 0,
                  background: `${color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#888',
                }}>
                  No img
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: '#777', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.description.slice(0, 80)}{item.description.length > 80 ? '…' : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>{images.length} image{images.length !== 1 ? 's' : ''}</span>
                  <span style={{ fontSize: '11px', color, fontWeight: 600 }}>{label} bg</span>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>· {item.tapeColor} tape</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <a
                  href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{ background: 'none', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '6px', padding: '7px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => openEdit(item)}
                  style={{ background: 'none', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '6px', padding: '7px', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center' }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${item.title}"?`)) handleDelete(item.id);
                  }}
                  style={{ background: 'none', border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: '6px', padding: '7px', cursor: 'pointer', color: '#D7263D', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid rgba(0,0,0,0.15)',
  borderRadius: '6px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '14px',
  background: 'rgba(255,255,255,0.8)',
  boxSizing: 'border-box',
  outline: 'none',
};

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const saveBtnStyle: React.CSSProperties = {
  background: '#2E294E', color: '#fff', border: 'none',
  borderRadius: '7px', padding: '10px 22px', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600,
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'transparent', color: '#555',
  border: '1.5px solid rgba(0,0,0,0.15)',
  borderRadius: '7px', padding: '10px 22px', cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600,
};
