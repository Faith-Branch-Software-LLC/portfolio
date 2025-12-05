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
    keywords: post.tags ? post.tags.split(',').join(', ') : 'software development, programming, tech blog',
    authors: [{ name: "Faith Branch Software LLC" }],
    creator: "Faith Branch Software LLC",
    publisher: "Faith Branch Software LLC",
    metadataBase: new URL('https://faithbranch.com'),
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: `https://faithbranch.com/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      siteName: 'Faith Branch Software LLC',
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt?.toISOString() || post.createdAt.toISOString(),
      authors: ['Faith Branch Software LLC'],
      section: 'Technology',
      tags: post.tags ? post.tags.split(',') : [],
      images: [
        {
          url: post.imageUrl || '/icon.svg',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.imageUrl || '/icon.svg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
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
  
  const htmlContent = post.content ? await markdownToHtml(post.content) : '';

  // JSON-LD structured data for the blog post
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.imageUrl || 'https://faithbranch.com/icon.svg',
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt?.toISOString() || post.createdAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Faith Branch Software LLC',
      url: 'https://faithbranch.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Faith Branch Software LLC',
      url: 'https://faithbranch.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://faithbranch.com/icon.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://faithbranch.com/blog/${post.slug}`,
    },
    ...(post.tags && {
      keywords: post.tags.split(',').map(tag => tag.trim()),
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostContent post={post} htmlContent={htmlContent} />
    </>
  );
}



