import Section, { SectionTitle } from "@/components/ui/section";
import Profile from "./profile";

export default function OurTeamSection() {
  return (
    <Section className="bg-backgroundRed" layer={4}>
      <SectionTitle>Our Team</SectionTitle>
      <Profile imageUrl="/images/sebastian-profile.jpg" name="Sebastian Neiswanger" description="B.S. in Computer Science from Cedarville University. Building user-focused web applications and software since 2019, with a focus on clean architecture, scalable solutions, and delivering real results for clients." />
    </Section>
  );
}
