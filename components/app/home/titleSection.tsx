import Section, { SectionTitle } from "@/components/ui/section";
// import AnimatedLogo from "@/components/ui/AnimatedLogo";
import Image from "next/image";

export default function TitleSection() {
  return (
    <Section className="bg-backgroundRed" layer={0}>
      {/* <AnimatedLogo className="w-3/4 h-3/4 md:w-1/4 md:h-1/4" /> */}
      <Image
        src="/logo.svg"
        alt="Faith Branch Software LLC logo"
        width={200}
        height={200}
        className="w-48 md:w-64"
        priority
      />
      <SectionTitle className="text-4xl md:text-5xl lg:text-6xl">Faith Branch Software LLC</SectionTitle>
      <p className="text-white font-gelasio text-lg md:text-xl text-center max-w-2xl text-balance leading-relaxed">
        Crafting thoughtful software with integrity, precision, and purpose.
      </p>
    </Section>
  );
}
