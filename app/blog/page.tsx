import React from 'react';
import { syncMarkdownPostsWithDb, getPaginatedBlogPosts } from '@/lib/blog';
import BlogPageContent from '@/components/app/blog/BlogPageContent';

interface BlogPageProps {
  searchParams: {
    page?: string;
  };
}

/**
 * Fetches paginated blog posts from the database
 * @param page The page number to fetch
 * @returns The paginated blog posts and metadata
 */
async function getBlogPostsData(page: number = 1) {
  const pageSize = 9; // Show 9 posts per page
  
  // Sync markdown posts with database first
  await syncMarkdownPostsWithDb();
  
  // Get paginated blog posts
  return await getPaginatedBlogPosts(page, pageSize);
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
  
  // Get paginated blog posts
  const { posts, pagination } = await getBlogPostsData(currentPage);

  return <BlogPageContent posts={posts} pagination={pagination} />;
}



