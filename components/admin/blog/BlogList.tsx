'use client';

import { useState } from 'react';
import { useTransitionRouter } from 'next-transition-router';
import { PenLine, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { publishBlogPost, unpublishBlogPost, deleteBlogPost } from '@/lib/actions/admin/blog';

type Post = {
  id: number;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  tags: string | null;
  imageUrl: string | null;
  updatedAt: Date;
};

export default function BlogList({ initialPosts }: { initialPosts: Post[] }) {
  const router = useTransitionRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [busy, setBusy] = useState<number | null>(null);

  async function togglePublish(post: Post) {
    setBusy(post.id);
    try {
      if (post.published) {
        await unpublishBlogPost(post.id);
      } else {
        await publishBlogPost(post.id);
      }
      setPosts(ps =>
        ps.map(p => (p.id === post.id ? { ...p, published: !p.published } : p))
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(post: Post) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setBusy(post.id);
    try {
      await deleteBlogPost(post.id);
      setPosts(ps => ps.filter(p => p.id !== post.id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 700, color: '#2E294E', margin: 0 }}>
          Blog Posts
        </h1>
        <button
          onClick={() => router.push('/admin/blog/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: '#2E294E', color: '#fff', border: 'none',
            borderRadius: '6px', padding: '10px 18px',
            fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600,
            cursor: 'pointer', boxShadow: '3px 3px 0 0 rgba(0,0,0,0.18)',
          }}
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {posts.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(46,41,78,0.45)', fontFamily: "'DM Sans', sans-serif", paddingTop: '60px' }}>
          No posts yet. Click "New Post" to get started.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
        {posts.map(post => (
          <div
            key={post.id}
            style={{
              background: '#fff', border: '1.5px solid rgba(46,41,78,0.12)',
              borderRadius: '8px', padding: '20px',
              boxShadow: '3px 3px 0 0 rgba(0,0,0,0.08)',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <span
                style={{
                  fontSize: '11px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px',
                  borderRadius: '4px', flexShrink: 0,
                  background: post.published ? 'rgba(27,153,139,0.12)' : 'rgba(244,96,54,0.12)',
                  color: post.published ? '#1B998B' : '#F46036',
                }}
              >
                {post.published ? 'Published' : 'Draft'}
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: 'rgba(46,41,78,0.45)' }}>
                {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 700, color: '#2E294E', lineHeight: 1.3 }}>
                {post.title}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(46,41,78,0.6)', marginTop: '5px', lineHeight: 1.5 }}>
                {post.description}
              </div>
            </div>

            {post.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {post.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span
                    key={tag}
                    style={{
                      background: 'rgba(46,41,78,0.08)', color: '#2E294E',
                      borderRadius: '4px', padding: '2px 7px',
                      fontFamily: 'Courier New, monospace', fontSize: '11px',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => router.push(`/admin/blog/${post.id}`)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: '#F4EAD4', color: '#2E294E', border: 'none',
                  borderRadius: '5px', padding: '8px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600,
                  boxShadow: '2px 2px 0 0 rgba(0,0,0,0.12)',
                }}
              >
                <PenLine size={14} />
                Edit
              </button>

              <button
                onClick={() => togglePublish(post)}
                disabled={busy === post.id}
                title={post.published ? 'Unpublish' : 'Publish'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: post.published ? 'rgba(244,96,54,0.1)' : 'rgba(27,153,139,0.1)',
                  color: post.published ? '#F46036' : '#1B998B',
                  border: 'none', borderRadius: '5px', padding: '8px 12px',
                  cursor: busy === post.id ? 'not-allowed' : 'pointer',
                  opacity: busy === post.id ? 0.6 : 1,
                }}
              >
                {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>

              <button
                onClick={() => handleDelete(post)}
                disabled={busy === post.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(215,38,61,0.08)', color: '#D7263D',
                  border: 'none', borderRadius: '5px', padding: '8px 12px',
                  cursor: busy === post.id ? 'not-allowed' : 'pointer',
                  opacity: busy === post.id ? 0.6 : 1,
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
