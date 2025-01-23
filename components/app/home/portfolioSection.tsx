import Section, { SectionTitle } from "@/components/ui/section";
import ScrapBook from "./scrapBook";

export default function PortfolioSection() {
  return (
    <Section className="bg-backgroundRed" layer={2}>
      <SectionTitle>Scrapbook</SectionTitle>
      <ScrapBook />
    </Section>
  );
}