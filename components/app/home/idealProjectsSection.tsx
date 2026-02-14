import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Section, { SectionTitle } from "@/components/ui/section";
import { Code, Users, Rocket } from "lucide-react";

export default function IdealProjectsSection() {
  const projects = [
    {
      icon: Code,
      title: "New Web Applications",
      description:
        "Dynamic, user-focused solutions built from the ground up with modern frameworks like Next.js for fast, responsive, and SEO-friendly results.",
    },
    {
      icon: Users,
      title: "Client Collaboration",
      description:
        "Close partnership throughout the entire process to ensure your vision is fully realized with tailored solutions that meet your unique goals.",
    },
    {
      icon: Rocket,
      title: "Scalable Platforms",
      description:
        "E-commerce sites, business platforms, or custom software\u2014built clean, scalable, and high-performing from day one.",
    },
  ];

  return (
    <Section className="bg-teal" layer={3}>
      <SectionTitle>Ideal Projects</SectionTitle>
      <p className="text-white font-gelasio text-lg md:text-xl text-center max-w-2xl text-balance leading-relaxed">
        We are passionate about creating innovative websites and software that bring ideas to life.
        Here is what we do best.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
        {projects.map((project) => (
          <Card key={project.title} className="flex flex-col items-center text-center">
            <CardHeader className="flex flex-col items-center gap-3 pb-2">
              <div className="rounded-full bg-teal p-3">
                <project.icon className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <CardTitle className="text-xl md:text-2xl">{project.title}</CardTitle>
            </CardHeader>
            <CardContent className="leading-relaxed">
              {project.description}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-white font-gelasio text-lg text-center max-w-xl leading-relaxed">
        Looking to create something fresh? We would love to explore how we can work together.
      </p>
    </Section>
  );
}
