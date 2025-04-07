"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Section from "@/components/ui/section";

/**
 * Header component for the blog section that includes navigation links and logo
 */
export default function Header() {
  return (
    <Section className="bg-darkPurple" layer={0}>
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <Image 
              src="/logo.svg" 
              alt="Faith Branch Logo" 
              width={100} 
              height={32}
              priority
            />
            <span className="hidden md:inline text-white text-xl font-bold">
              Faith Branch
            </span>
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-white hover:text-white/80">
              Home
            </Link>
            <Link href="/blog" className="text-white hover:text-white/80">
              Blog
            </Link>
          </div>
        </div>
      </nav>
    </Section>
  );
} 