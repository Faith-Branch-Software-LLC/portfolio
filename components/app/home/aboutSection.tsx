import Section, { SectionTitle } from "@/components/ui/section";
import ContactForm from "../contactForm";
import { Hand, Highlight, ScrapColors, StickyNote, TapeColor } from "@/components/app/scrapbookElements";

export default function AboutSection() {
  return (
    <Section className="bg-teal" id="about" layer={1}>
      <div className="flex items-baseline gap-3 flex-wrap justify-center">
        <SectionTitle>About Us</SectionTitle>
        <Hand color={ScrapColors.olive} size={28} rot={-6}>~ our mission ~</Hand>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-5xl">
        <div className="flex flex-col gap-8 flex-shrink-0" style={{ maxWidth: 380 }}>
          <StickyNote rot={-1.2} tapeColor={TapeColor.Red}>
            <p className="font-gelasio text-base leading-relaxed mb-4">
              We at Faith Branch Software LLC are dedicated to crafting{" "}
              <Highlight>exceptional websites and software</Highlight> that exceed
              expectations. Guided by Biblical ethics, we approach every project
              with integrity, transparency, and a heart for service.
            </p>
            <p className="font-gelasio text-base leading-relaxed">
              Every solution is tailored.{" "}
              <Highlight color="rgba(244,96,54,0.5)">Proudly made in the USA.</Highlight>{" "}
              Guest-based design means every interaction feels intuitive and meaningful.
            </p>
          </StickyNote>

          <StickyNote rot={1.8} paperColor="#e8d8a8" tapeColor={TapeColor.Orange}>
            <p
              className="font-fraunces italic text-lg leading-relaxed mb-4"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              &ldquo;And do not be conformed to this world, but be transformed by
              the renewing of your mind, so that you may prove what the will of God
              is — that is which is good and acceptable and perfect.&rdquo;
            </p>
            <div className="text-right">
              <Hand color={ScrapColors.purple} size={26} rot={-4}>— Romans 12:2</Hand>
            </div>
          </StickyNote>
        </div>

        <div className="flex-1 w-full">
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
