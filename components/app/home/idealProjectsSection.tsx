import Section, { SectionTitle } from "@/components/ui/section";
import { Hand, Highlight, ScrapColors, StickyNote, TapeColor } from "@/components/app/scrapbookElements";

export default function IdealProjectsSection() {
  return (
    <Section className="bg-teal" layer={3}>
      <div className="flex items-baseline gap-3 flex-wrap justify-center">
        <SectionTitle>Ideal Projects</SectionTitle>
        <Hand color={ScrapColors.olive} size={28} rot={-5}>~ what I love ~</Hand>
      </div>

      <div className="w-full max-w-3xl">
        <StickyNote rot={0.8} tapeColor={TapeColor.Orange}>
          <p className="font-gelasio text-base leading-relaxed mb-4">
            Passionate about creating innovative websites and software. My ideal
            projects involve developing new, user-focused solutions{" "}
            <Highlight>from the ground up</Highlight> — whether it&apos;s a dynamic
            web application or a feature-rich software platform, I strive to deliver
            clean, scalable, and high-performing products.
          </p>
          <p className="font-gelasio text-base leading-relaxed mb-4">
            Particularly excited to work with modern technologies like{" "}
            <Highlight color="rgba(244,96,54,0.5)">Next.js</Highlight> — fast,
            responsive, SEO-friendly applications. I love collaborating closely with
            clients so their vision is fully realized.
          </p>
          <p className="font-gelasio text-base leading-relaxed">
            Looking to create something fresh — a business website, e-commerce
            platform, or custom software?{" "}
            <Hand color={ScrapColors.red} size={22} rot={-2} href="#about" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
              let&apos;s talk →
            </Hand>
          </p>
        </StickyNote>
      </div>
    </Section>
  );
}
