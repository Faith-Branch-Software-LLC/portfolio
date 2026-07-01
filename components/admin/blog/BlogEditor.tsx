'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTransitionRouter } from 'next-transition-router';
import { ArrowLeft, Image, Eye, EyeOff, Save, Trash2, FolderOpen, X } from 'lucide-react';
import { createBlogPost, updateBlogPost, publishBlogPost, unpublishBlogPost, deleteBlogPost } from '@/lib/actions/admin/blog';
import { LayoutProvider } from '@/lib/context/layoutContext';
import PreviewSection from './PreviewSection';

type Post = {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string | null;
  published: boolean;
  tags: string | null;
  imageUrl: string | null;
  createdAt: Date;
};

type Props =
  | { mode: 'new' }
  | { mode: 'edit'; post: Post };

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toDateValue(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export default function BlogEditor(props: Props) {
  const router = useTransitionRouter();
  const isEdit = props.mode === 'edit';
  const initial = isEdit ? props.post : null;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugManual, setSlugManual] = useState(isEdit);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tags, setTags] = useState(initial?.tags ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [publishDate, setPublishDate] = useState(initial?.createdAt ? toDateValue(initial.createdAt) : toDateValue(new Date()));
  const [published, setPublished] = useState(initial?.published ?? false);
  const [preview, setPreview] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showPublicPicker, setShowPublicPicker] = useState(false);
  const [publicImages, setPublicImages] = useState<string[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPreview = useCallback(async (md: string) => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/admin/blog/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: md }),
      });
      const data = await res.json();
      if (data.html) setPreview(data.html);
    } catch {
      // ignore preview errors
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => fetchPreview(content), 600);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [content, fetchPreview]);

  // Load initial preview
  useEffect(() => { fetchPreview(content); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const handleSlugChange = (v: string) => {
    setSlug(v);
    setSlugManual(true);
  };

  const insertAtCursor = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + text + content.slice(end);
    setContent(next);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + text.length;
      el.focus();
    }, 0);
  }, [content]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/portfolio/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) insertAtCursor(`![${file.name}](${data.url})`);
    } catch {
      setError('Image upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function openPublicPicker() {
    setShowPublicPicker(true);
    if (publicImages.length > 0) return;
    setPublicLoading(true);
    try {
      const res = await fetch('/api/admin/blog/images');
      const data = await res.json();
      if (data.images) setPublicImages(data.images);
    } catch {
      setError('Failed to load public images');
    } finally {
      setPublicLoading(false);
    }
  }

  function insertPublicImage(url: string) {
    const filename = url.split('/').pop() ?? 'image';
    insertAtCursor(`![${filename}](${url})`);
    setShowPublicPicker(false);
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateBlogPost(initial!.id, { title, description, content, tags, imageUrl, slug, publishDate });
      } else {
        await createBlogPost({ title, description, content, tags, imageUrl, publishDate });
      }
      router.push('/admin/blog');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (!isEdit) return;
    setSaving(true);
    setError('');
    try {
      if (published) {
        await unpublishBlogPost(initial!.id);
        setPublished(false);
      } else {
        await updateBlogPost(initial!.id, { title, description, content, tags, imageUrl, slug, publishDate });
        await publishBlogPost(initial!.id);
        setPublished(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteBlogPost(initial!.id);
      router.push('/admin/blog');
    } catch {
      setError('Delete failed');
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1.5px solid rgba(46,41,78,0.18)', borderRadius: '6px',
    padding: '9px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px',
    color: '#2E294E', background: '#fff', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '5px',
    fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
    fontWeight: 600, color: 'rgba(46,41,78,0.6)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9F7F2' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 20px', background: '#2E294E',
        borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }}>
        <button
          onClick={() => router.push('/admin/blog')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: '4px' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '15px', color: '#fff', flex: 1 }}>
          {isEdit ? 'Edit Post' : 'New Post'}
        </span>

        <span style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '4px 10px', borderRadius: '4px',
          background: published ? 'rgba(27,153,139,0.25)' : 'rgba(244,96,54,0.25)',
          color: published ? '#4de0cc' : '#f99',
        }}>
          {published ? 'Published' : 'Draft'}
        </span>

        <button
          onClick={() => setShowPreview(v => !v)}
          title={showPreview ? 'Hide preview' : 'Show preview'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', padding: '4px' }}
        >
          {showPreview ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(215,38,61,0.1)', color: '#D7263D', padding: '10px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', flexShrink: 0 }}>
          {error}
        </div>
      )}

      {/* Main split area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Left: fields + editor */}
        <div style={{ width: showPreview ? '50%' : '100%', display: 'flex', flexDirection: 'column', borderRight: showPreview ? '2px solid rgba(46,41,78,0.1)' : 'none', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 8px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, overflowY: 'auto', maxHeight: '320px' }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Post title" />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input
                style={{ ...inputStyle, fontFamily: 'Courier New, monospace', fontSize: '13px', color: 'rgba(46,41,78,0.6)' }}
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder="auto-generated-from-title"
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description for listing / SEO" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Tags (comma-separated)</label>
                <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="react, nextjs, typescript" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Publish Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={publishDate}
                  onChange={e => setPublishDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Cover Image URL</label>
              <input style={inputStyle} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://... (or use Insert Image below)" />
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => !uploading && fileRef.current?.click()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(46,41,78,0.08)', color: '#2E294E',
                  border: 'none', borderRadius: '5px', padding: '6px 11px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1,
                }}
              >
                <Image size={13} />
                {uploading ? 'Uploading…' : 'Upload Image'}
              </button>
              <button
                type="button"
                onClick={openPublicPicker}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: 'rgba(27,153,139,0.12)', color: '#1B998B',
                  border: '1px solid rgba(27,153,139,0.3)', borderRadius: '5px', padding: '6px 11px',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FolderOpen size={13} />
                Public Images
              </button>
            </div>

            {/* Public image picker */}
            {showPublicPicker && (
              <div style={{
                border: '1.5px solid rgba(27,153,139,0.3)', borderRadius: '8px',
                background: '#fff', padding: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: 'rgba(46,41,78,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    /public/images
                  </span>
                  <button
                    onClick={() => setShowPublicPicker(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(46,41,78,0.4)', display: 'flex', padding: '2px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {publicLoading ? (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(46,41,78,0.5)', padding: '8px 0' }}>Loading…</div>
                ) : publicImages.length === 0 ? (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(46,41,78,0.5)', padding: '8px 0' }}>No images found in /public/images</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {publicImages.map(url => (
                      <button
                        key={url}
                        onClick={() => insertPublicImage(url)}
                        title={url}
                        style={{
                          background: 'rgba(46,41,78,0.04)', border: '1.5px solid rgba(46,41,78,0.1)',
                          borderRadius: '5px', padding: '4px', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '3px' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: '9px',
                          color: 'rgba(46,41,78,0.5)', overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', width: '100%', textAlign: 'center',
                        }}>
                          {url.split('/').pop()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Markdown textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your post in markdown…"
            style={{
              flex: 1, minHeight: 0, resize: 'none', border: 'none',
              borderTop: '1.5px solid rgba(46,41,78,0.1)',
              padding: '16px 20px', fontFamily: 'Courier New, monospace',
              fontSize: '14px', lineHeight: 1.7, color: '#2E294E',
              background: '#fff', outline: 'none',
            }}
          />
        </div>

        {/* Right: preview — uses actual Section + LayoutProvider, matches live blog exactly */}
        {showPreview && (() => {
          const sections = preview.split(/<hr\s*\/?>/gi).filter(s => s.trim());
          // Background seen through spike teeth = what the next section would be
          const containerBg = sections.length % 2 === 0 ? '#D7263D' : '#1B998B';
          // Compensate for translateY stacking + last section's pb-[97px] with no successor
          const SPIKE = 97;
          const TRANS = 100;
          const totalTranslation = Math.max(0, sections.length - 1) * TRANS;
          return (
            <div style={{ width: '50%', overflow: 'auto', position: 'relative', background: containerBg }}>
              {previewLoading && (
                <div style={{
                  position: 'absolute', top: '10px', right: '14px', zIndex: 10,
                  fontFamily: "'DM Sans', sans-serif", fontSize: '11px',
                  color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px',
                }}>
                  rendering…
                </div>
              )}
              <LayoutProvider>
                <div style={{ marginBottom: `-${totalTranslation + SPIKE}px` }}>
                  {sections.map((section, i) => {
                    const isRed = i % 2 === 0;
                    const bgColor = isRed ? 'bg-backgroundRed' : 'bg-teal';
                    const textClasses = isRed
                      ? 'prose-headings:text-white prose-p:text-white prose-li:text-white prose-li:marker:text-white prose-strong:text-white prose-em:text-white'
                      : 'prose-headings:text-black prose-p:text-black prose-li:text-black prose-li:marker:text-black prose-strong:text-black prose-em:text-black';
                    return (
                      <PreviewSection key={i} index={i} className={bgColor}>
                        <div className="container mx-auto px-4 py-8">
                          <div
                            className={`prose prose-lg max-w-none prose-headings:font-black prose-a:bg-darkPurple prose-a:text-white prose-a:px-2 prose-a:py-1 prose-a:rounded-md prose-a:shadow-button prose-img:rounded-lg prose-img:max-h-[350px] prose-img:w-auto prose-pre:bg-[#002B36] prose-pre:text-[#eee8d5] prose-pre:rounded-lg prose-pre:shadow-card prose-pre:p-4 prose-ol:list-decimal prose-ul:list-disc font-gelasio ${textClasses}`}
                            dangerouslySetInnerHTML={{ __html: section }}
                          />
                        </div>
                      </PreviewSection>
                    );
                  })}
                </div>
              </LayoutProvider>
            </div>
          );
        })()}
      </div>

      {/* Bottom action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 20px', background: '#2E294E',
        borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }}>
        {isEdit && (
          <button
            onClick={handleDelete}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(215,38,61,0.2)', color: '#ff8080',
              border: 'none', borderRadius: '5px', padding: '9px 14px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}

        <div style={{ flex: 1 }} />

        {isEdit && (
          <button
            onClick={handleTogglePublish}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: published ? 'rgba(244,96,54,0.2)' : 'rgba(27,153,139,0.2)',
              color: published ? '#f99' : '#4de0cc',
              border: 'none', borderRadius: '5px', padding: '9px 16px',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: '#F4EAD4', color: '#2E294E',
            border: 'none', borderRadius: '5px', padding: '9px 20px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            boxShadow: '2px 2px 0 0 rgba(0,0,0,0.18)',
          }}
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
