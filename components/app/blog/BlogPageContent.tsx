'use client';

import React from 'react';
import BlogCard from '@/components/app/blog/BlogCard';
import BlogPagination, { PaginationMetadata } from '@/components/app/blog/BlogPagination';
import Section from '@/components/ui/section';
import { useLayout } from '@/lib/context/layoutContext';
import { BlogPost } from '@/types/blog';
import Footer from '@/components/app/footer';

interface BlogPageContentProps {
  posts: BlogPost[];
  pagination: PaginationMetadata;
}

/**
 * Client-side component for displaying blog posts with layout context
 * @param posts Array of blog posts to display
 * @param pagination Pagination data for the blog posts
 * @returns The blog page content with layout context
 */
export default function BlogPageContent({ posts, pagination }: BlogPageContentProps) {
  const { totalTranslation } = useLayout();

  return (
    <div 
      className="h-fit"
      style={{ 
        height: `calc(100vh - ${totalTranslation}px)`,
        marginBottom: `-${totalTranslation}px`
      }}
    >
      <Section className="bg-teal" layer={1}>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Blog</h1>
          
          {/* Pagination at the top */}
          {pagination.totalPages > 1 && (
            <div className="mb-8">
              <BlogPagination pagination={pagination} />
            </div>
          )}
          
          {posts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 dark:text-gray-400">No blog posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
          
          {/* Pagination at the bottom */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <BlogPagination pagination={pagination} />
            </div>
          )}
        </div>
      </Section>
      <Footer layer={2} />
    </div>
  );
} 