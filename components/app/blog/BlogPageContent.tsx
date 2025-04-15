'use client';

import React, { useEffect, useState } from 'react';
import BlogCard from '@/components/app/blog/BlogCard';
import BlogPagination, { PaginationMetadata } from '@/components/app/blog/BlogPagination';
import Section from '@/components/ui/section';
import { useLayout } from '@/lib/context/layoutContext';
import { BlogPost } from '@/types/blog';
import Footer from '@/components/app/footer';
import { motion, AnimatePresence } from 'motion/react';
import { getContainerSize } from '@/lib/utils';

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
  const [displayedPosts, setDisplayedPosts] = useState<BlogPost[]>([]);
  const [currentPage, setCurrentPage] = useState(pagination.currentPage);
  const [postsPerPage, setPostsPerPage] = useState(9);

  useEffect(() => {
    const updatePostsPerPage = () => {
      const size = getContainerSize(window.innerWidth);
      setPostsPerPage(size === 'mobile' ? 5 : 9);
    };

    updatePostsPerPage();
    window.addEventListener('resize', updatePostsPerPage);
    return () => window.removeEventListener('resize', updatePostsPerPage);
  }, []);

  useEffect(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    setDisplayedPosts(posts.slice(startIndex, endIndex));
  }, [posts, currentPage, postsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(posts.length / postsPerPage);

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
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold mb-8 text-center"
          >
            Blog
          </motion.h1>
          
          {/* Pagination at the top */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <BlogPagination 
                pagination={{
                  ...pagination,
                  currentPage,
                  totalPages,
                  hasNextPage: currentPage < totalPages,
                  hasPreviousPage: currentPage > 1
                }}
                onPageChange={handlePageChange}
              />
            </motion.div>
          )}
          
          {displayedPosts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-10"
            >
              <p className="text-gray-600 dark:text-gray-400">No blog posts found.</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {displayedPosts.map((post, index) => (
                  <BlogCard key={post.id} post={post} index={index} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
          
          {/* Pagination at the bottom */}
          {totalPages > 1 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              <BlogPagination 
                pagination={{
                  ...pagination,
                  currentPage,
                  totalPages,
                  hasNextPage: currentPage < totalPages,
                  hasPreviousPage: currentPage > 1
                }}
                onPageChange={handlePageChange}
              />
            </motion.div>
          )}
        </div>
      </Section>
      <Footer layer={2} />
    </motion.div>
  );
} 