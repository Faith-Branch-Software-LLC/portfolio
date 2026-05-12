import Section, { SectionTitle } from "@/components/ui/section";
import Image from "next/image";
import { Hand, Highlight, ScrapColors, StickyNote, TapeColor } from "@/components/app/scrapbookElements";

export default function OurTeamSection() {
  return (
    <Section className="bg-backgroundRed" layer={4}>
      <div className="flex items-baseline gap-3 flex-wrap justify-center">
        <SectionTitle className="text-white">Our Team</SectionTitle>
        <Hand color={ScrapColors.olive} size={28} rot={-5}>~ team of one ~</Hand>
      </div>

      <div className="w-full max-w-3xl">
        <StickyNote rot={-1} tapeColor={TapeColor.Teal}>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-7 items-center">
            <Image
              src="/images/sebastian-profile.jpg"
              alt="Sebastian Neiswanger"
              width={200}
              height={200}
              className="rounded-full shadow-card mx-auto"
              style={{ width: 200, height: 200, objectFit: "cover" }}
            />
            <div>
              <h3 className="font-fraunces font-black text-3xl mb-1">Sebastian Neiswanger</h3>
              <Hand color={ScrapColors.red} size={22} rot={-3} style={{ marginBottom: 12, display: "inline-block" }}>
                founder · engineer
              </Hand>
              <p className="font-gelasio text-base leading-relaxed mt-3">
                B.S. Computer Science,{" "}
                <Highlight>Cedarville University</Highlight>. Working in the
                field since 2019. Passionate about clean, scalable,
                high-performing products built from the ground up.
              </p>
            </div>
          </div>
        </StickyNote>
      </div>
    </Section>
  );
}
