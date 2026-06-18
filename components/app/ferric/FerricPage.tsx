'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import Footer from '@/components/app/footer';
import { useLayout } from '@/lib/context/layoutContext';

// Ferric app color tokens
const C = {
  bg:          '#fff8f0',
  surface:     '#f5e8d0',
  surface2:    '#fbecd0',
  transport:   '#f6e7cb',
  drawer:      '#e8d4b8',
  text:        '#221b0a',
  secondary:   '#554336',
  accent:      '#9c3f00',
  separator:   '#dbc2b0',
  flipYellow:  '#fdc425',
  flipYellowFg:'#6d5200',
};

const features = [
  { icon: '📼', title: 'Cassette Library', body: 'Browse your collection in a scrollable grid. Each tape has its own look, tracklist, and personality.' },
  { icon: '🎡', title: 'Animated Playback', body: 'Watch the reels spin, tape fill, and wear in real time. It looks and feels like the real thing.' },
  { icon: '🔄', title: 'Side A / Side B', body: 'Flip your tape with an authentic animation. Two sides, two playlists, one cassette.' },
  { icon: '🎨', title: 'Drawing Editor', body: 'Decorate your tapes with a pen, eraser, and stickers. Make each cassette yours.' },
  { icon: '🎵', title: 'Apple Music', body: 'Pull tracks from your Apple Music library or local files. No ripping required.' },
  { icon: '🔒', title: 'Lock Screen Controls', body: 'Full Now Playing integration — control playback from your lock screen, AirPods, or CarPlay.' },
];

function EjectButton() {
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: C.transport, borderRadius: 999,
        padding: '6px 12px', color: C.secondary,
        fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 17h14v2H5zm7-12L5.33 15h13.34L12 5z"/>
      </svg>
      EJECT
    </div>
  );
}

function TransportControls({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
      {/* Rewind */}
      <button
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 10, color: C.secondary }}
        aria-label="Rewind"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
        </svg>
      </button>

      {/* Play / Pause */}
      <button
        onClick={onToggle}
        style={{
          width: 72, height: 72, borderRadius: '50%',
          background: C.accent, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${C.accent}66`,
          color: 'white', flexShrink: 0,
        }}
        aria-label={playing ? 'Stop' : 'Play'}
      >
        {playing ? (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      {/* Fast-forward */}
      <button
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 10, color: C.secondary }}
        aria-label="Fast-forward"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
        </svg>
      </button>
    </div>
  );
}

function FlipButton() {
  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: C.transport, border: 'none', borderRadius: 999,
        padding: '8px 20px', color: C.secondary, cursor: 'pointer',
        fontSize: 11, fontWeight: 600, letterSpacing: '0.15em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
      </svg>
      FLIP SIDE
    </button>
  );
}

function ContactForm() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res  = await fetch('/api/ferric/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (data.ok) { setStatus('sent'); setName(''); setEmail(''); setMessage(''); }
      else          { setStatus('error'); }
    } catch { setStatus('error'); }
  }

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.surface2, border: `1.5px solid ${C.separator}`,
    borderRadius: 8, padding: '10px 14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 15, color: C.text, outline: 'none',
  };

  const label: React.CSSProperties = {
    display: 'block', marginBottom: 6,
    fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
    color: C.secondary, fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  return (
    <div style={{ maxWidth: 480, width: '100%' }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: C.secondary, marginBottom: 4, fontFamily: 'system-ui, -apple-system, sans-serif' }}>SUPPORT</p>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 4, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Get in touch</h2>
      <p style={{ color: C.secondary, marginBottom: 24, fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 15 }}>Bug, question, or feedback? We read everything.</p>

      {status === 'sent' ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: 20, background: C.surface2, borderRadius: 12, color: C.text, fontFamily: 'system-ui, sans-serif' }}
        >
          Message sent — we&apos;ll get back to you soon.
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={label}>NAME</label>
            <input style={input} value={name} onChange={e => setName(e.target.value)} required maxLength={100} placeholder="Your name" />
          </div>
          <div>
            <label style={label}>EMAIL</label>
            <input type="email" style={input} value={email} onChange={e => setEmail(e.target.value)} required maxLength={200} placeholder="you@example.com" />
          </div>
          <div>
            <label style={label}>MESSAGE</label>
            <textarea style={{ ...input, resize: 'none' as const }} rows={4} value={message} onChange={e => setMessage(e.target.value)} required maxLength={2000} placeholder="Describe your issue or question..." />
          </div>
          {status === 'error' && (
            <p style={{ color: '#c0392b', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>Something went wrong. Try emailing sneiswanger@faithbranch.com</p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              background: C.accent, color: 'white', border: 'none', borderRadius: 10,
              padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              opacity: status === 'sending' ? 0.6 : 1,
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function FerricPage() {
  const { totalTranslation } = useLayout();
  const [playing, setPlaying] = useState(false);

  return (
    <div style={{ marginBottom: `-${totalTranslation}px` }}>

      {/* ── Hero: Player Screen ── */}
      <section style={{ background: C.bg, minHeight: '100dvh', display: 'flex', flexDirection: 'column', paddingTop: 60 }}>
        <div style={{ maxWidth: 420, width: '100%', margin: '0 auto', padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Image src="/ferric-icon.png" alt="Ferric" width={36} height={36} style={{ borderRadius: 8 }} />
              <span style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Ferric</span>
            </div>
            <EjectButton />
          </div>

          {/* Cassette */}
          <motion.div
            className="cassette-float"
            style={{ width: '100%', aspectRatio: '1230/780', position: 'relative' }}
          >
            <Image
              src="/cassette_retro_a_visible.svg"
              alt="Ferric cassette player"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </motion.div>

          {/* Track info */}
          <div style={{ textAlign: 'center', margin: '24px 0 20px' }}>
            <p style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '0.18em',
              color: C.secondary, marginBottom: 6,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>SIDE A</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 3, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Mixed Feelings
            </p>
            <p style={{ fontSize: 14, color: C.secondary, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Your Library
            </p>
          </div>

          {/* Transport */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <TransportControls playing={playing} onToggle={() => setPlaying(p => !p)} />
          </div>

          {/* Flip side */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <FlipButton />
          </div>

          {/* Tagline + badges */}
          <div style={{ textAlign: 'center', paddingBottom: 48, borderTop: `1px solid ${C.separator}`, paddingTop: 32 }}>
            <p style={{ color: C.secondary, fontSize: 15, lineHeight: 1.6, marginBottom: 20, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              A nostalgic cassette player for iPhone. Create virtual tapes, add your music, and listen in style.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: C.transport, color: C.secondary, borderRadius: 999,
                padding: '6px 16px', fontSize: 13, fontWeight: 500,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>iOS 26.2+</span>
              <span style={{
                background: C.accent, color: 'white', borderRadius: 999,
                padding: '6px 16px', fontSize: 13, fontWeight: 500,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>TestFlight Beta</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ background: C.surface, padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: C.secondary, marginBottom: 6, fontFamily: 'system-ui, -apple-system, sans-serif' }}>FEATURES</p>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 40, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Everything on the tape.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {features.map(f => (
              <div
                key={f.title}
                style={{
                  background: C.bg, borderRadius: 14, padding: '20px 22px',
                  border: `1px solid ${C.separator}`,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support ── */}
      <section id="support" style={{ background: C.transport, padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 48 }}>
          <ContactForm />

          <div style={{ borderTop: `1px solid ${C.separator}`, paddingTop: 24, width: '100%' }}>
            <a
              href="/ferric/privacy"
              style={{ color: C.secondary, fontSize: 14, fontFamily: 'system-ui, -apple-system, sans-serif', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Privacy Policy →
            </a>
          </div>
        </div>
      </section>

      <Footer layer={1} />
    </div>
  );
}
