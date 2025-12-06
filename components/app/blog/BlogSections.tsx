'use client';

import { useMemo } from 'react';
import BlogSection from './BlogSection';
import Footer from '@/components/app/footer';

interface BlogSectionsProps {
  htmlContent: string;
}

/**
 * Splits HTML content by <hr> tags and renders each section
 * in a BlogSection component with alternating colors
 */
export default function BlogSections({ htmlContent }: BlogSectionsProps) {
  // Split HTML content by <hr> tags
  const sections = useMemo(() => {
    // Split by <hr> tags (handles various formats: <hr>, <hr />, <hr/>)
    const parts = htmlContent.split(/<hr\s*\/?>/gi);

    // Filter out empty sections
    return parts.filter(section => section.trim().length > 0);
  }, [htmlContent]);

  return (
    <>
      {sections.map((sectionContent, index) => {
        // Determine if this is a red section (even index)
        const isRedSection = index % 2 === 0;

        return (
          <BlogSection key={index} sectionIndex={index}>
            <div className="container mx-auto px-4 py-8">
              <div
                className={`prose prose-lg max-w-none prose-headings:font-black prose-a:bg-darkPurple prose-a:text-white prose-a:px-2 prose-a:py-1 prose-a:rounded-md prose-a:shadow-button prose-img:rounded-lg prose-img:max-h-[350px] prose-img:w-auto prose-pre:bg-[#002B36] prose-pre:text-[#eee8d5] prose-pre:rounded-lg prose-pre:shadow-card prose-pre:p-4 prose-ol:list-decimal prose-ul:list-disc font-gelasio ${
                  isRedSection
                    ? 'prose-headings:text-white prose-p:text-white prose-li:text-white prose-li:marker:text-white prose-strong:text-white prose-em:text-white'
                    : 'prose-headings:text-black prose-p:text-black prose-li:text-black prose-li:marker:text-black prose-strong:text-black prose-em:text-black'
                }`}
                dangerouslySetInnerHTML={{ __html: sectionContent }}
              />
            </div>
          </BlogSection>
        );
      })}
      <Footer layer={sections.length + 2} />
    </>
  );
}
