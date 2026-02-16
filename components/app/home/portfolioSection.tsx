import Section, { SectionTitle } from "@/components/ui/section";
import { ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import UnderlineLink from "@/components/ui/underline-link";

export default function PortfolioSection() {
  return (
    <Section className="bg-backgroundRed" layer={2}>
      <SectionTitle className="text-white">Explore</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 w-full max-w-4xl">
        <div className="flex flex-col gap-4 font-gelasio md:text-lg text-white p-4">
          <p>
            Take a look at some of the projects we have built for our clients
            and ourselves. From web applications to financial tools, each project
            reflects our commitment to quality and thoughtful design.
          </p>
          <UnderlineLink href="/portfolio" icon={ArrowRight} iconSize={20} className="font-fraunces text-xl text-white">
            View Portfolio
          </UnderlineLink>
        </div>
        <Separator orientation="vertical" className="hidden md:block bg-white/50" />
        <Separator orientation="horizontal" className="block md:hidden bg-white/50" />
        <div className="flex flex-col gap-4 font-gelasio md:text-lg text-white p-4">
          <p>
            Read our latest thoughts on software development, web technologies,
            and insights from our projects. We share what we learn along the way.
          </p>
          <UnderlineLink href="/blog" icon={ArrowRight} iconSize={20} className="font-fraunces text-xl text-white">
            Read the Blog
          </UnderlineLink>
        </div>
      </div>
    </Section>
  );
}
