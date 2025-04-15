"use server";

import { getPaginatedBlogPosts } from "../blog";

/**
 * Fetches paginated blog posts from the database
 * @param page The page number to fetch
 * @returns The paginated blog posts and metadata
 */
export async function getBlogPostsData(page: number = 1, pageSize: number = 9) {
  // Get paginated blog posts
  return await getPaginatedBlogPosts(page, pageSize);
}