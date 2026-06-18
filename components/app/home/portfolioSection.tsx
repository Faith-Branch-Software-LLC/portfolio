import Section, { SectionTitle } from "@/components/ui/section";
import { Hand, ScrapColors, StickyNote, TapeColor } from "@/components/app/scrapbookElements";

export default function PortfolioSection() {
  return (
    <Section className="bg-backgroundRed" layer={2}>
      <div className="flex items-baseline gap-3 flex-wrap justify-center">
        <SectionTitle className="text-white">Explore</SectionTitle>
        <Hand color={ScrapColors.olive} size={28} rot={-4}>~ what we&apos;ve made ~</Hand>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-5xl">
        <StickyNote rot={-1.5} tapeColor={TapeColor.Purple}>
          <h3 className="font-fraunces font-black text-3xl mb-3">Portfolio</h3>
          <p className="font-gelasio text-base leading-relaxed mb-5">
            Web apps, financial tools, and small experiments — each project
            reflects a commitment to quality and thoughtful design.
          </p>
          <Hand color={ScrapColors.red} size={24} rot={-3} href="/portfolio" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            View portfolio →
          </Hand>
        </StickyNote>

        <StickyNote rot={1.5} tapeColor={TapeColor.Orange}>
          <h3 className="font-fraunces font-black text-3xl mb-3">Ferric</h3>
          <p className="font-gelasio text-base leading-relaxed mb-5">
            A nostalgic cassette player for iPhone. Create virtual tapes, add
            your music, and watch the reels spin.
          </p>
          <Hand color={ScrapColors.teal} size={24} rot={-3} href="/ferric" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            See the app →
          </Hand>
        </StickyNote>

        <StickyNote rot={-0.8} tapeColor={TapeColor.Teal}>
          <h3 className="font-fraunces font-black text-3xl mb-3">Blog</h3>
          <p className="font-gelasio text-base leading-relaxed mb-5">
            Thoughts on software development, web technologies, and insights from
            our projects. We share what we learn along the way.
          </p>
          <Hand color={ScrapColors.purple} size={24} rot={-3} href="/blog" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
            Read the blog →
          </Hand>
        </StickyNote>
      </div>
    </Section>
  );
}
