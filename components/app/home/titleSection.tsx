import Section, { SectionTitle } from "@/components/ui/section";
import Image from "next/image";

export default function TitleSection() {
  return (
    <Section className="bg-backgroundRed" layer={0}>
      <Image src="/logo.svg" alt="Faith Branch Software LLC" width={100} height={100} className="w-1/4 h-1/4" />
      <SectionTitle className="text-4xl md:text-5xl lg:text-6xl">Faith Branch Software LLC</SectionTitle>
    </Section>
  );
}