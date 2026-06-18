'use client';

import { motion } from 'motion/react';
import Footer from '@/components/app/footer';
import { useLayout } from '@/lib/context/layoutContext';

const C = {
  bg:        '#fff8f0',
  surface:   '#f5e8d0',
  transport: '#f6e7cb',
  text:      '#221b0a',
  secondary: '#554336',
  accent:    '#9c3f00',
  separator: '#dbc2b0',
};

export default function FerricPrivacyPage() {
  const { totalTranslation } = useLayout();

  const h2: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };
  const p: React.CSSProperties = {
    fontSize: 15, color: C.secondary, lineHeight: 1.7,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  return (
    <div style={{ marginBottom: `-${totalTranslation}px` }}>
      <section style={{ background: C.bg, minHeight: '100dvh', padding: '72px 24px 64px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          <a
            href="/ferric"
            style={{ fontSize: 13, color: C.secondary, textDecoration: 'underline', textUnderlineOffset: 3, display: 'inline-block', marginBottom: 32, fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            ← Back to Ferric
          </a>

          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', color: C.secondary, marginBottom: 6, fontFamily: 'system-ui, -apple-system, sans-serif' }}>FERRIC · FAITH BRANCH SOFTWARE LLC</p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Privacy Policy</h1>
          <p style={{ ...p, marginBottom: 48 }}>Last updated: June 17, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

            <section style={{ borderTop: `1px solid ${C.separator}`, paddingTop: 28 }}>
              <h2 style={h2}>We collect nothing.</h2>
              <p style={p}>
                Ferric does not collect, transmit, or store any personal data on our servers.
                Everything you do in the app — your cassette library, artwork, track lists, and playback history —
                lives exclusively on your device.
              </p>
            </section>

            <section style={{ borderTop: `1px solid ${C.separator}`, paddingTop: 28 }}>
              <h2 style={h2}>Your music stays yours.</h2>
              <p style={p}>
                Ferric accesses your music library and local files solely to let you add tracks to cassettes.
                No audio files, metadata, or listening habits are transmitted anywhere. Playback happens entirely on-device.
              </p>
            </section>

            <section style={{ borderTop: `1px solid ${C.separator}`, paddingTop: 28 }}>
              <h2 style={h2}>Third-party sign-in.</h2>
              <p style={p}>
                If Ferric connects to any third-party service (such as YouTube or a streaming provider), any credentials or
                access tokens granted by that service are stored <strong>only on your device</strong>.
                Faith Branch Software LLC never receives, stores, or has access to those tokens.
              </p>
            </section>

            <section style={{ borderTop: `1px solid ${C.separator}`, paddingTop: 28 }}>
              <h2 style={h2}>Analytics &amp; crash reporting.</h2>
              <p style={p}>
                Ferric does not use any third-party analytics or crash reporting SDKs. The only diagnostic
                data Apple may collect is governed by Apple&apos;s own{' '}
                <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer"
                  style={{ color: C.accent, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Privacy Policy
                </a>
                , which you control through iOS Settings → Privacy.
              </p>
            </section>

            <section style={{ borderTop: `1px solid ${C.separator}`, paddingTop: 28 }}>
              <h2 style={h2}>Data deletion.</h2>
              <p style={p}>
                Because we hold no data about you, there is nothing for us to delete.
                Uninstalling Ferric removes all app data from your device immediately.
              </p>
            </section>

            <section style={{ borderTop: `1px solid ${C.separator}`, paddingTop: 28 }}>
              <h2 style={h2}>Contact.</h2>
              <p style={p}>
                Questions? Reach us at{' '}
                <a href="mailto:sneiswanger@faithbranch.com"
                  style={{ color: C.accent, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  sneiswanger@faithbranch.com
                </a>
                {' '}or use the{' '}
                <a href="/ferric#support"
                  style={{ color: C.accent, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  support form
                </a>.
              </p>
            </section>

          </div>
        </motion.div>
      </section>

      <Footer layer={1} />
    </div>
  );
}
