import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Section, { SectionTitle } from "@/components/ui/section";
import { Separator } from "@/components/ui/separator";
import ContactForm from "../contactForm";

export default function AboutSection() {
  return (
    <Section className="bg-teal" id="about" layer={1}>
      <SectionTitle>About Us</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <p className="leading-relaxed">
              We craft exceptional websites and software solutions that exceed the expectations of our clients.
              Guided by Biblical ethics, we approach every project with integrity, transparency,
              and a heart for service.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="text-backgroundRed font-fraunces font-bold text-xl leading-none mt-0.5">{'/'}</span>
                <p className="leading-relaxed">
                  <span className="font-semibold font-fraunces">Tailored Solutions</span>{' \u2014 '}
                  Every project is uniquely designed to serve the specific needs of those we work with.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-backgroundRed font-fraunces font-bold text-xl leading-none mt-0.5">{'/'}</span>
                <p className="leading-relaxed">
                  <span className="font-semibold font-fraunces">Guest-Based Design</span>{' \u2014 '}
                  We prioritize the user experience, ensuring every interaction feels intuitive and meaningful.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-backgroundRed font-fraunces font-bold text-xl leading-none mt-0.5">{'/'}</span>
                <p className="leading-relaxed">
                  <span className="font-semibold font-fraunces">Made in the USA</span>{' \u2014 '}
                  Created with care and precision that reflects our values and roots.
                </p>
              </div>
            </div>
            <div className="border-l-4 border-teal pl-4 mt-2">
              <p className="italic leading-relaxed">
                &quot;And do not be conformed to this world, but be transformed by the renewing of your mind, 
                so that you may prove what the will of God is, that which is good and acceptable and perfect.&quot;
              </p>
              <p className="font-semibold font-fraunces mt-2">
                {'Romans 12:2'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Separator orientation="vertical" className="hidden md:block" />
        <Separator orientation="horizontal" className="block md:hidden" />
        <ContactForm />
      </div>
    </Section>
  );
}
