'use client';

import { motion } from 'motion/react';
import { Link } from 'next-transition-router';
import Footer from '@/components/app/footer';
import Section, { SectionTitle } from '@/components/ui/section';
import { Hand, ScrapColors, StickyNote, TapeColor } from '@/components/app/scrapbookElements';
import { useLayout } from '@/lib/context/layoutContext';

export default function FerricPrivacyPage() {
  const { totalTranslation } = useLayout();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ marginBottom: `-${totalTranslation}px` }}
    >

      {/* ── Header ── */}
      <Section className="bg-darkPurple" layer={0}>
        <div className="w-full max-w-3xl">
          <Link href="/ferric" className="inline-block mb-8 text-base font-fraunces font-semibold text-white/70 underline underline-offset-4 hover:text-white">
            ← Back to Ferric
          </Link>
          <div className="flex items-baseline gap-3 flex-wrap mb-3">
            <SectionTitle className="text-white">Privacy Policy</SectionTitle>
            <Hand color={ScrapColors.olive} size={22} rot={-4}>~ Ferric ~</Hand>
          </div>
          <p className="text-white/50 text-sm font-gelasio mb-8">
            Faith Branch Software LLC · Last updated: June 24, 2026
          </p>
          <StickyNote rot={0.4} tapeColor={TapeColor.Teal}>
            <p className="font-gelasio text-base leading-relaxed text-black/80">
              Ferric is built on a simple principle: your data belongs to you. Ferric does not collect, transmit, or store any personal information on external servers. Everything you create in the app lives on your device and nowhere else. This policy explains what permissions Ferric requests, why those permissions are needed, and how information is handled in all cases.
            </p>
          </StickyNote>
        </div>
      </Section>

      {/* ── Data Collection and Permissions ── */}
      <Section className="bg-teal" layer={1}>
        <div className="w-full max-w-3xl">
          <div className="flex items-baseline gap-3 flex-wrap justify-center mb-8">
            <SectionTitle className="text-white">What Ferric Accesses</SectionTitle>
            <Hand color={ScrapColors.olive} size={20} rot={-3}>~ on your device ~</Hand>
          </div>
          <div className="flex flex-col gap-5">
            <StickyNote rot={0.5} tapeColor={TapeColor.Orange}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">No Personal Data Is Collected</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Ferric does not collect your name, email address, phone number, location, IP address, device identifiers, or any other personal information. No account is required to use Ferric. No user profiles are created or stored.
              </p>
            </StickyNote>
            <StickyNote rot={-0.6} tapeColor={TapeColor.Orange}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">Music Library Access</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Ferric requests access to your device music library and local audio files so you can add tracks to cassettes. This access is read-only. No audio files, track metadata, listening history, or playlist information is transmitted off your device. All playback happens locally.
              </p>
            </StickyNote>
            <StickyNote rot={0.4} tapeColor={TapeColor.Orange}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">Local Storage</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Your cassette library, custom artwork, track lists, playback progress, and app settings are stored locally on your device using standard iOS data storage. This data never leaves your device through Ferric. Uninstalling Ferric permanently removes all locally stored app data from your device.
              </p>
            </StickyNote>
          </div>
        </div>
      </Section>

      {/* ── Third Parties and Analytics ── */}
      <Section className="bg-backgroundRed" layer={2}>
        <div className="w-full max-w-3xl">
          <div className="flex items-baseline gap-3 flex-wrap justify-center mb-8">
            <SectionTitle className="text-white">Third Parties</SectionTitle>
            <Hand color={ScrapColors.olive} size={20} rot={-5}>~ and analytics ~</Hand>
          </div>
          <div className="flex flex-col gap-5">
            <StickyNote rot={-0.5} tapeColor={TapeColor.Teal}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">No Analytics or Tracking SDKs</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Ferric does not include any third-party analytics, advertising, tracking, or crash reporting frameworks. No data is shared with advertising networks, data brokers, or any third-party services through Ferric.
              </p>
            </StickyNote>
            <StickyNote rot={0.6} tapeColor={TapeColor.Teal}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">External Service Connections</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Ferric may allow you to connect optional external services such as streaming platforms. If you choose to connect such a service, any authentication credentials or access tokens are stored exclusively on your device. Faith Branch Software LLC does not receive, handle, or have access to those credentials. Your use of any external service is governed by that service's own privacy policy.
              </p>
            </StickyNote>
            <StickyNote rot={-0.4} tapeColor={TapeColor.Teal}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">Apple Platform Data</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Ferric is distributed through Apple's platforms. Apple may collect certain diagnostic, usage, or crash data as part of its operating system and App Store services. This collection is governed by{' '}
                <a
                  href="https://www.apple.com/legal/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-darkPurple underline underline-offset-2"
                >
                  Apple's Privacy Policy
                </a>
                , not this one. You can review and adjust Apple's data collection in iOS Settings under Privacy and Security.
              </p>
            </StickyNote>
          </div>
        </div>
      </Section>

      {/* ── Your Rights and Contact ── */}
      <Section className="bg-teal" layer={3}>
        <div className="w-full max-w-3xl">
          <div className="flex items-baseline gap-3 flex-wrap justify-center mb-8">
            <SectionTitle className="text-white">Your Rights</SectionTitle>
            <Hand color={ScrapColors.olive} size={20} rot={-3}>~ and contact ~</Hand>
          </div>
          <div className="flex flex-col gap-5">
            <StickyNote rot={0.5} tapeColor={TapeColor.Orange}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">Data Deletion</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Because Ferric holds no data about you on any server, there is nothing for us to delete on your behalf. To remove all Ferric data from your device, uninstall the app. iOS will permanently erase all locally stored app data at that time.
              </p>
            </StickyNote>
            <StickyNote rot={-0.5} tapeColor={TapeColor.Orange}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">Children's Privacy</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Ferric does not knowingly collect personal information from anyone, including children under the age of 13. Because no data is collected at all, Ferric is compliant with the Children's Online Privacy Protection Act (COPPA) by design.
              </p>
            </StickyNote>
            <StickyNote rot={0.3} tapeColor={TapeColor.Orange}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">California and GDPR Rights</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                California residents and users in the European Economic Area have rights under the CCPA and GDPR respectively, including the right to know what personal data is held, the right to delete it, and the right to opt out of its sale. Because Ferric collects no personal data and sells no data to any party, these rights are satisfied by default. If you have questions about your specific rights, contact us at the address below.
              </p>
            </StickyNote>
            <StickyNote rot={-0.4} tapeColor={TapeColor.Orange}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">Policy Changes</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                If this privacy policy changes in any material way, the updated policy will be published here and the date at the top of this page will be updated. Continued use of Ferric after a policy update constitutes acceptance of the revised terms.
              </p>
            </StickyNote>
            <StickyNote rot={0.5} tapeColor={TapeColor.Teal}>
              <h3 className="font-fraunces font-bold text-lg mb-2 text-black">Contact</h3>
              <p className="font-gelasio text-base leading-relaxed text-black/70">
                Faith Branch Software LLC<br />
                Questions, concerns, or privacy-related requests can be sent to{' '}
                <a href="mailto:sneiswanger@faithbranch.com" className="text-darkPurple underline underline-offset-2">
                  sneiswanger@faithbranch.com
                </a>
                {' '}or submitted through the{' '}
                <Link href="/ferric#support" className="text-darkPurple underline underline-offset-2">
                  Ferric support form
                </Link>
                . We will respond to all legitimate requests within a reasonable time.
              </p>
            </StickyNote>
          </div>
        </div>
      </Section>

      <Footer layer={4} />
    </motion.div>
  );
}
