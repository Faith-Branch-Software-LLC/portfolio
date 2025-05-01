import React from 'react';
import { getBlogPostBySlug, markdownToHtml } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogPostContent from '@/components/app/blog/BlogPostContent';

/**
 * Generates metadata for the blog post page
 * @param params The parameters from the URL
 * @returns The metadata for the blog post
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  
  if (!id) {
    return {
      title: 'Blog Post Not Found',
    };
  }
  
  const post = await getBlogPostBySlug(id);
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }
  
  return {
    title: post.title,
    description: post.description,
  };
}

/**
 * Individual blog post page component
 * @param params The parameters from the URL
 * @returns The blog post page
 */
export default async function BlogPostPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }
  
  const post = await getBlogPostBySlug(id);
  
  if (!post) {
    notFound();
  }
  
  const htmlContent = post.content ? markdownToHtml(post.content) : '';
  
  return <BlogPostContent post={post} htmlContent={htmlContent} />;
}



