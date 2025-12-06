'use client';

import Section from '@/components/ui/section';

interface BlogSectionProps {
  children: React.ReactNode;
  sectionIndex: number;
}

/**
 * Wrapper around Section component that applies alternating colors
 * for blog post sections
 */
export default function BlogSection({ children, sectionIndex }: BlogSectionProps) {
  // Alternate between backgroundRed and teal
  const bgColor = sectionIndex % 2 === 0 ? 'bg-backgroundRed' : 'bg-teal';

  // Layer starts at 1 (0 is reserved for header if needed)
  const layer = sectionIndex + 2;

  return (
    <Section className={bgColor} layer={layer}>
      {children}
    </Section>
  );
}
