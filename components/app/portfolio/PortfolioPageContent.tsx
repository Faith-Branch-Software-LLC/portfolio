'use client';

import React, { useRef, useCallback } from 'react';
import Image from 'next/image';
import Section from '@/components/ui/section';
import { useLayout } from '@/lib/context/layoutContext';
import Footer from '@/components/app/footer';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import UnderlineLink from '@/components/ui/underline-link';
import gsap from 'gsap';

interface Project {
  title: string;
  description: string;
  url: string;
  images: string[];
  isRed: boolean;
}

const projects: Project[] = [
  {
    title: 'Homework Muffin',
    description:
      'In 2023, I worked on Homework Muffin as a Senior Design Project. It is a web/mobile application that helps students organize their homework and study for exams.',
    url: 'https://homeworkmuffin.com',
    images: ['/scrapBookImages/hwm-1.jpg', '/scrapBookImages/hwm-2.jpg'],
    isRed: true,
  },
  {
    title: 'Austintown Fence',
    description:
      'The first project since the start of the company. We were tasked with creating a website for a local fence company. We were able to create a really nice website with admin tools to help manage the website after the project was completed. This was made using Next.js and served on AWS Amplify. I learned a lot about comunicating with clients through this process.',
    url: 'https://austintownfence.org',
    images: ['/scrapBookImages/afc-1.jpg', '/scrapBookImages/afc-2.jpg'],
    isRed: false,
  },
  {
    title: 'EyeOnFi',
    description:
      "EyeOnFi is a financial forecasting tool that helps everyday people make better financial decisions. By imputing your financial data, EyeOnFi will help you forecast your financial future, helping to make informed decisions about your finances. Also, created in Next.js, we sought to leverage SSR and CSR to make a easy and fun experience for everyone. This project is still ongoing and has it's sights on something big.",
    url: 'https://app.eyeonfi.com',
    images: ['/scrapBookImages/eof-1.jpg', '/scrapBookImages/eof-2.jpg'],
    isRed: true,
  },
];

function PageStack({ images, title }: { images: string[]; title: string }) {
  const img0Ref = useRef<HTMLDivElement>(null);
  const img1Ref = useRef<HTMLDivElement>(null);

  const bringToFront = useCallback((target: HTMLDivElement | null, other: HTMLDivElement | null) => {
    if (!target || !other) return;
    gsap.to(target, { zIndex: 10, scale: 1.05, duration: 0.3, ease: 'power2.out' });
    gsap.to(other, { zIndex: 1, scale: 0.95, duration: 0.3, ease: 'power2.out' });
  }, []);

  return (
    <div className="relative w-[220px] h-[340px] md:w-[420px] md:h-[550px] mx-auto md:mx-0 overflow-visible">
      <div
        ref={img0Ref}
        onMouseEnter={() => bringToFront(img0Ref.current, img1Ref.current)}
        className="absolute top-0 left-0 w-[170px] h-[240px] md:w-[300px] md:h-[430px] rounded-lg overflow-hidden shadow-card cursor-pointer"
        style={{ transform: 'rotate(-4deg)', zIndex: 2 }}
      >
        <Image
          src={images[0]}
          alt={`${title} screenshot 1`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 170px, 300px"
        />
      </div>
      <div
        ref={img1Ref}
        onMouseEnter={() => bringToFront(img1Ref.current, img0Ref.current)}
        className="absolute top-[50px] left-[60px] md:top-[100px] md:left-[130px] w-[170px] h-[240px] md:w-[300px] md:h-[430px] rounded-lg overflow-hidden shadow-card cursor-pointer"
        style={{ transform: 'rotate(3deg)', zIndex: 1 }}
      >
        <Image
          src={images[1]}
          alt={`${title} screenshot 2`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 170px, 300px"
        />
      </div>
    </div>
  );
}

export default function PortfolioPageContent() {
  const { totalTranslation } = useLayout();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        height: `calc(100vh - ${totalTranslation}px)`,
        marginBottom: `-${totalTranslation}px`,
      }}
    >
      {projects.map((project, i) => (
        <Section key={project.title} className={project.isRed ? "bg-backgroundRed" : "bg-teal"} layer={i + 1}>
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-12 md:gap-20 w-full max-w-6xl mx-auto items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <PageStack images={project.images} title={project.title} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col gap-4"
            >
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold font-fraunces ${project.isRed ? 'text-white' : ''}`}>
                {project.title}
              </h2>
              <p className={`font-gelasio md:text-lg ${project.isRed ? 'text-white' : ''}`}>
                {project.description}
              </p>
              <UnderlineLink
                href={project.url}
                icon={ArrowUpRight}
                iconSize={18}
                color={project.isRed ? 'white' : '#2E294E'}
                className={`font-fraunces text-lg ${project.isRed ? 'text-white' : 'text-darkPurple'}`}
              >
                Visit Project
              </UnderlineLink>
            </motion.div>
          </div>
        </Section>
      ))}
      <Footer layer={projects.length + 1} />
    </motion.div>
  );
}
