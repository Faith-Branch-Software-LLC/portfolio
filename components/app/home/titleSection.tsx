import Section, { SectionTitle } from "@/components/ui/section";
import AnimatedLogo from "@/components/ui/AnimatedLogo";

export default function TitleSection() {
  return (
    <Section className="bg-backgroundRed" layer={0}>
      <AnimatedLogo className="w-3/4 h-3/4 md:w-1/4 md:h-1/4" />
      <SectionTitle className="text-4xl md:text-5xl lg:text-6xl text-white">Faith Branch Software LLC</SectionTitle>
    </Section>
  );
}