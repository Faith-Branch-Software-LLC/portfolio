'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { BlogPost } from '@/types/blog';
import Footer from '@/components/app/footer';
import { useLayout } from '@/lib/context/layoutContext';
import Section from '@/components/ui/section';

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
      <Section className="bg-teal" layer={1}>
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href="/blog"
              className="inline-flex items-center mb-6 px-4 py-2 bg-darkPurple text-white rounded-lg font-gelasio shadow-button transition-all duration-300"
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

            <h1 className="text-3xl font-bold mb-4 font-gelasio">{post.title}</h1>

            <div className="flex items-center mb-6 text-gray-600 dark:text-gray-400">
              <span className="font-gelasio">{formattedDate}</span>
              <span className="mx-2">•</span>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className="p-1 bg-[#aaaaaa] dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm shadow-button font-gelasio"
                  >
                    {tag.trim()}
                  </motion.span>
                ))}
              </div>
            </div>

            {post.imageUrl && (
              <div className="relative w-full mb-8 overflow-hidden">
                <div className="max-h-[400px] sm:max-h-[500px] w-full flex justify-center items-center bg-teal py-6 faded-sides">
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

          {/* Markdown Content Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-black prose-a:bg-darkPurple prose-a:text-white prose-a:px-2 prose-a:py-1 prose-a:rounded-md prose-a:shadow-button prose-p:text-black prose-img:rounded-lg prose-img:h-[350px] prose-img:w-auto prose-pre:bg-[#002B36] prose-pre:text-[#eee8d5] prose-pre:rounded-lg prose-pre:shadow-card prose-pre:p-4 prose-li:text-black font-gelasio"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </Section>

      <Footer layer={2} />
    </motion.div>
  );
} 