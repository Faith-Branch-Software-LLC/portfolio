import Section, { SectionTitle } from "@/components/ui/section";
import { Separator } from "@/components/ui/separator";
import ContactForm from "../contactForm";

export default function AboutSection() {
  return (
    <Section className="bg-teal" id="about" layer={1}>
      <SectionTitle>About Us</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-start">
        <div className="flex flex-col gap-3 font-gelasio md:text-lg p-5">
          <h3 className="text-2xl md:text-3xl font-bold font-fraunces">Our Mission</h3>
          <p>
            We at Faith Branch Software LLC are dedicated to crafting exceptional websites and software
            solutions that not only meet but exceed the expectations of our clients. Guided by our unwavering
            commitment to Biblical ethics, we approach every project with integrity, transparency, and a heart
            for service. Our goal is to deliver unique, complete, and thoughtful experiences, ensuring
            every solution is tailored to the needs of those we serve. Proudly made in the USA, we take
            inspiration from our roots, creating with care and precision that reflects our values. By
            focusing on guest-based design, we prioritize the user experience, ensuring that every interaction
            with our creations feels intuitive, meaningful, and impactful.
          </p>
          <p className="text-center italic mt-8">
            &quot;And do not be conformed to this world, but be transformed by the renewing of your mind,
            so that you may prove what the will of God is, that is which is good and acceptable and perfect.&quot;
            <span className="font-semibold not-italic">- Romans 12:2</span>
          </p>
        </div>
        <Separator orientation="vertical" className="hidden md:block" />
        <Separator orientation="horizontal" className="block md:hidden" />
        <ContactForm />
      </div>
    </Section>
  );
}
