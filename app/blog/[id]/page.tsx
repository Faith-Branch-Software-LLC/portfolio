import React from 'react';
import { getBlogPostBySlug, markdownToHtml } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogPostContent from '@/components/app/blog/BlogPostContent';

interface BlogPostPageProps {
  params: {
    id: string;
  };
}

/**
 * Generates metadata for the blog post page
 * @param props The parameters from the URL
 * @returns The metadata for the blog post
 */
export async function generateMetadata(
  props: BlogPostPageProps
): Promise<Metadata> {
  const params = await Promise.resolve(props.params);
  const id = params.id;
  
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
 * @param props The parameters from the URL
 * @returns The blog post page
 */
export default async function BlogPostPage(props: BlogPostPageProps) {
  const params = await Promise.resolve(props.params);
  const id = params.id;
  
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



