'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Link } from 'next-transition-router';
import Footer from '@/components/app/footer';
import Section, { SectionTitle } from '@/components/ui/section';
import { Hand, Highlight, ScrapColors, StickyNote, TapeColor } from '@/components/app/scrapbookElements';
import { LayoutGrid, Play, Repeat2, Pencil, Music, Lock, Ban, Clock3 } from 'lucide-react';
import { useLayout } from '@/lib/context/layoutContext';

const features = [
  { icon: LayoutGrid, title: 'Cassette Library',     body: 'Browse your collection in a scrollable grid. Each tape has its own look, tracklist, and personality.' },
  { icon: Play,       title: 'Animated Playback',    body: 'Watch the reels spin, tape fill, and wear down in real time. It looks and feels like the real thing.' },
  { icon: Repeat2,    title: 'Side A / Side B',      body: 'Save songs to both sides of the cassette. Flipping partway through Side A will land you partway through Side B.' },
  { icon: Pencil,     title: 'Drawing Editor',       body: 'Decorate your tapes with a pen, eraser, and stickers. Make each cassette yours.' },
  { icon: Music,      title: 'External Services',    body: 'Pull tracks from your Apple Music library, local files, or many other external services!' },
  { icon: Lock,       title: 'Lock Screen Controls', body: 'Full Now Playing integration. Control playback from your lock screen, AirPods, or CarPlay.' },
];

const apiStatuses = [
  {
    icon: Ban,
    status: 'Blocked',
    title: 'YouTube Music',
    body: "Can't integrate — YouTube's API Terms of Service prohibit this kind of use.",
  },
  {
    icon: Clock3,
    status: 'Not yet',
    title: 'Spotify',
    body: 'Integration is built, but locked behind a 250,000 MAU requirement Ferric hasn’t hit yet.',
  },
];

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

  const inputClass = 'w-full bg-offWhite border border-black/10 rounded-lg px-4 py-2.5 font-gelasio text-black outline-none text-base';
  const labelClass = 'block mb-1.5 text-xs font-semibold tracking-widest text-black/60 uppercase font-fraunces';

  return (
    <div className="w-full">
      {status === 'sent' ? (
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="font-gelasio text-base text-black/70 bg-offWhite rounded-xl p-5"
        >
          Message sent — we&apos;ll get back to you soon.
        </motion.p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required maxLength={100} placeholder="Your name" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={email} onChange={e => setEmail(e.target.value)} required maxLength={200} placeholder="you@example.com" />
          </div>
          <div>
            <label className={labelClass}>Message</label>
            <textarea className={`${inputClass} resize-none`} rows={4} value={message} onChange={e => setMessage(e.target.value)} required maxLength={2000} placeholder="Describe your issue or question..." />
          </div>
          {status === 'error' && (
            <p className="text-backgroundRed text-sm font-gelasio">Something went wrong. Try emailing sneiswanger@faithbranch.com</p>
          )}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="bg-darkPurple text-white rounded-xl px-7 py-3.5 font-fraunces font-semibold text-base cursor-pointer disabled:opacity-60"
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

  return (
    <div style={{ marginBottom: `-${totalTranslation}px` }}>

      {/* ── Hero ── */}
      <Section className="bg-teal" layer={0}>
        <div className="flex items-center gap-2 mb-4">
          <Image src="/ferric-icon.png" alt="Ferric" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-bold font-fraunces text-white">Ferric</span>
        </div>

        <motion.div className="cassette-float w-full max-w-4xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/retroA_display.png"
            alt="Ferric cassette player"
            className="w-full h-auto"
          />
        </motion.div>

        <div className="text-center mt-2 w-full max-w-4xl border-t border-white/30 pt-6">
          <p className="font-gelasio text-white/80 text-base leading-relaxed mb-4">
            A nostalgic cassette player for iPhone. Create virtual tapes, add your music, and listen in style.
          </p>
          <div className="flex gap-3 justify-center flex-wrap items-center">
            <span className="bg-white/20 text-white rounded-full px-4 py-1.5 text-sm font-fraunces font-medium">iOS 26.2+</span>
            <a
              href="https://apps.apple.com/us/app/ferric/id6774606842"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-orange rounded-full px-4 py-1.5 text-sm font-fraunces font-semibold hover:bg-white/90"
            >
              Download on the App Store →
            </a>
          </div>
        </div>
      </Section>

      {/* ── Features ── */}
      <Section className="bg-backgroundRed" layer={1}>
        <div className="flex items-baseline gap-3 flex-wrap justify-center">
          <SectionTitle className="text-white">Everything on the tape.</SectionTitle>
          <Hand color={ScrapColors.olive} size={26} rot={-5}>~ features ~</Hand>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl">
          {features.map((f, i) => (
            <StickyNote
              key={f.title}
              rot={i % 2 === 0 ? 0.6 : -0.8}
              tapeColor={[TapeColor.Teal, TapeColor.Orange, TapeColor.Purple, TapeColor.Orange, TapeColor.Purple, TapeColor.Teal][i]}
            >
              <div className="flex gap-3 items-center mb-2">
                <f.icon className="w-5 h-5 flex-shrink-0 text-black/60" />
                <h3 className="font-fraunces font-bold text-lg text-black">{f.title}</h3>
              </div>
              <p className="font-gelasio text-sm leading-relaxed text-black/70">{f.body}</p>
            </StickyNote>
          ))}
        </div>
      </Section>

      {/* ── API Availability ── */}
      <Section className="bg-orange" layer={2}>
        <div className="flex items-baseline gap-3 flex-wrap justify-center">
          <SectionTitle className="text-white">Not hooked up (yet).</SectionTitle>
          <Hand color={ScrapColors.olive} size={26} rot={-5}>~ APIs ~</Hand>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
          {apiStatuses.map((a, i) => (
            <StickyNote
              key={a.title}
              rot={i % 2 === 0 ? 0.6 : -0.8}
              tapeColor={[TapeColor.Teal, TapeColor.Purple][i]}
            >
              <div className="flex gap-3 items-center mb-2">
                <a.icon className="w-5 h-5 flex-shrink-0 text-black/60" />
                <h3 className="font-fraunces font-bold text-lg text-black">{a.title}</h3>
                <span className="ml-auto text-[10px] font-fraunces font-semibold uppercase tracking-widest bg-black/10 text-black/60 rounded-full px-2 py-0.5">
                  {a.status}
                </span>
              </div>
              <p className="font-gelasio text-sm leading-relaxed text-black/70">{a.body}</p>
            </StickyNote>
          ))}
        </div>
      </Section>

      {/* ── Support ── */}
      <Section id="support" className="bg-teal" layer={3}>
        <div className="flex items-baseline gap-3 flex-wrap justify-center mb-4">
          <SectionTitle className="text-white">Get in touch.</SectionTitle>
          <Hand color={ScrapColors.olive} size={24} rot={-4}>~ support ~</Hand>
        </div>

        <StickyNote rot={-0.5} tapeColor={TapeColor.Orange} className="w-full max-w-lg">
          <ContactForm />
        </StickyNote>

        <div className="w-full max-w-lg border-t border-white/30 pt-5">
          <Link href="/ferric/privacy" className="text-white/70 text-sm font-gelasio underline underline-offset-4 hover:text-white">
            Privacy Policy →
          </Link>
        </div>
      </Section>

      <Footer layer={4} />
    </div>
  );
}
