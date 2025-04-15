import React from 'react';
import BlogPageContent from '@/components/app/blog/BlogPageContent';
import { syncMarkdownPostsWithDb, getAllBlogPosts } from '@/lib/blog';

interface BlogPageProps {
  searchParams: {
    page?: string;
  };
}

/**
 * Blog index page component
 * @param searchParams The search parameters from the URL
 * @returns The blog index page
 */
export default async function BlogPage({ searchParams }: BlogPageProps) {
  // Await the searchParams object before accessing its properties
  const params = await Promise.resolve(searchParams);
  const currentPage = params.page ? parseInt(params.page) : 1;

  await syncMarkdownPostsWithDb();
  const posts = await getAllBlogPosts();
  
  return (
    <BlogPageContent 
      posts={posts} 
      pagination={{
        currentPage,
        totalPages: Math.ceil(posts.length / 9), // Default to 9 posts per page
        hasNextPage: currentPage < Math.ceil(posts.length / 9),
        hasPreviousPage: currentPage > 1,
        totalCount: posts.length,
        pageSize: 9
      }} 
    />
  );
}
