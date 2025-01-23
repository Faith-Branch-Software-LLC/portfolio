import Image from "next/image";
import Section from "@/components/ui/section";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { FaDiscord, FaLinkedin, FaGithub } from "react-icons/fa";
import { Separator } from "../ui/separator";
import UnderlineLink from "@/components/ui/underline-link"

/**
 * Footer component that displays company logo, social links, contact information,
 * and copyright notice
 */
export default function Footer({layer}: {layer: number}) {
  return (
    <Section className="bg-darkPurple" layer={layer}>
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex flex-col md:flex-row items-center justify-around gap-12 w-full">
          <div className="flex flex-col items-center gap-2">

            <Image
              src="/logo.svg"
              alt="Faith Branch Software LLC"
              width={100}
              height={100}
              className="w-72"
            />

            <div className="flex gap-4">
              <Link
                href="https://github.com/Faith-Branch-Software-LLC"
                target="_blank"
                className="text-white hover:text-white/80"
              >
                <FaGithub size={40} />
              </Link>
              <Link
                href="https://www.linkedin.com/in/sebastian-neiswanger/"
                target="_blank"
                className="text-white hover:text-white/80"
              >
                <FaLinkedin size={40} />
              </Link>
              <Link
                href="https://discordapp.com/users/Sebastian_Neiswanger"
                target="_blank"
                className="text-white hover:text-white/80"
              >
                <FaDiscord size={40} />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-8 font-gelasio text-xl text-white">
            <Link
              href="#about"
              scroll={false}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-2 hover:text-white/80 group w-full cursor-pointer"
            >
              <div className="flex items-center gap-2">
                Get in Touch
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
            <UnderlineLink href="tel:+13309930338" icon={Phone}>
              (330) 993-0338
            </UnderlineLink>
            <UnderlineLink href="mailto:sneiswanger@faithbranch.com" icon={Mail}>
              sneiswanger@faithbranch.com
            </UnderlineLink>
          </div>
        </div>

        <Separator orientation="horizontal" className="bg-white" />

        <p className="text-md text-white">
          © 2024 Faith Branch Software LLC. All rights reserved.
        </p>
      </div>
    </Section>
  );
}