import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getBlogPostBySlug, markdownToHtml } from '@/lib/blog';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

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
  // Await the params object before using it
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
  // Await the params object before using it
  const params = await Promise.resolve(props.params);
  const id = params.id;
  
  if (!id) {
    notFound();
  }
  
  const post = await getBlogPostBySlug(id);
  
  if (!post) {
    notFound();
  }
  
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Parse tags
  const tags = post.tags ? post.tags.split(',') : [];
  
  // Convert markdown content to HTML if available
  const htmlContent = post.content ? markdownToHtml(post.content) : '';
  
  // If no content is available, provide a message
  const displayContent = htmlContent ? (
    <div 
      className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-img:rounded-lg prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-4"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  ) : (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <p className="text-gray-600 dark:text-gray-400">{post.description}</p>
      <p className="text-gray-600 dark:text-gray-400 mt-4">Content unavailable. The markdown file for this post may be missing.</p>
    </div>
  );
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/blog" 
          className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
        
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        
        <div className="flex items-center mb-6 text-gray-600 dark:text-gray-400">
          <span>{formattedDate}</span>
          <span className="mx-2">•</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span 
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
        
        {post.imageUrl && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        {displayContent}
      </div>
    </main>
  );
}



