import { Card, CardContent } from "@/components/ui/card";
import Section, { SectionTitle } from "@/components/ui/section";

export default function IdealProjectsSection() {
  return (
    <Section className="bg-teal" layer={3}>
      <SectionTitle>Ideal Projects</SectionTitle>
      <Card>
        <CardContent className="text-center pt-3">
          I am passionate about creating innovative websites and software that bring ideas to life. 
          My ideal projects involve developing new, user-focused solutions from the ground up. 
          Whether it&apos;s a dynamic web application or a feature-rich software platform, 
          I strive to deliver clean, scalable, and high-performing products.
          <br />
          <br />
          I am particularly excited to work with modern technologies like Next.js, 
          which allow me to build fast, responsive, and SEO-friendly applications. 
          Beyond technology, I enjoy collaborating closely with clients to ensure their vision is fully realized, 
          offering tailored solutions that meet their unique goals and challenges.
          <br />
          <br />
          If you&apos;re looking to create something fresh, whether it&apos;s a business website, 
          an e-commerce platform, or custom software, I&apos;d love to explore how we can work together.
        </CardContent>
      </Card>
    </Section>
  );
}