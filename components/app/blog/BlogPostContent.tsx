'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { BlogPost } from '@/types/blog';
import { useLayout } from '@/lib/context/layoutContext';
import Section from '@/components/ui/section';
import BlogSections from './BlogSections';
import CodeBlock from './CodeBlock';

interface BlogPostContentProps {
  post: BlogPost;
  htmlContent: string;
}

/**
 * Client-side component for displaying a single blog post with layout context
 * @param post The blog post data
 * @param htmlContent The HTML content of the blog post
 * @returns The blog post content with layout context
 */
export default function BlogPostContent({ post, htmlContent }: BlogPostContentProps) {
  const { totalTranslation } = useLayout();
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tags = post.tags ? post.tags.split(',') : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-fit"
      style={{
        height: `calc(100vh - ${totalTranslation}px)`,
        marginBottom: `-${totalTranslation}px`
      }}
    >
      {/* Header Section with Post Metadata */}
      <Section className="bg-olive" layer={0}>
        <div className="container mx-auto px-4 py-8 pb-0">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/blog"
              className="inline-flex items-center mb-6 px-4 py-2 bg-black text-white rounded-lg font-gelasio shadow-button transition-all duration-300 hover:bg-teal hover:text-white"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Blog
            </Link>

            <h1 className="text-3xl font-bold mb-4 font-gelasio text-black">{post.title}</h1>

            <div className="flex items-center mb-6 text-black">
              <span className="font-gelasio">{formattedDate}</span>
              <span className="mx-2">•</span>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className="p-1 bg-darkPurple text-white rounded text-sm shadow-button font-gelasio"
                  >
                    {tag.trim()}
                  </motion.span>
                ))}
              </div>
            </div>

            {post.imageUrl && (
              <div className="relative w-full mb-8 overflow-hidden">
                <div className="max-h-[400px] sm:max-h-[500px] w-full flex justify-center items-center bg-olive py-6 faded-sides">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    width={1200}
                    height={1200}
                    className="max-h-[370px] sm:max-h-[470px] w-auto h-auto object-contain rounded-lg shadow-card"
                    priority
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </Section>

      {/* Blog Content Sections with Alternating Colors */}
      <BlogSections htmlContent={htmlContent} />

      {/* CodeBlock component for copy button hydration */}
      <CodeBlock />
    </motion.div>
  );
} 