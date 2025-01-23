import Section, { SectionTitle } from "@/components/ui/section";
import Profile from "./profile";

export default function OurTeamSection() {
  return (
    <Section className="bg-backgroundRed" layer={4}>
      <SectionTitle>Our Team</SectionTitle>
      <Profile imageUrl="/sebastian-profile.jpg" name="Sebastian Neiswanger" description="I Graduated from Cedarville University with a B.S. in Computer Science, and have been working in the field since 2019. I am passionate about creating innovative websites and software that bring ideas to life. My ideal projects involve developing new, user-focused solutions from the ground up. Whether it&apos;s a dynamic web application or a feature-rich software platform, I strive to deliver clean, scalable, and high-performing products." />
    </Section>
  );
}