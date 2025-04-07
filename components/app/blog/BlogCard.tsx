import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';

interface BlogCardProps {
  post: BlogPost;
}

/**
 * Displays a card for a blog post
 * @param post The blog post to display
 * @returns A component showing a summary of the blog post
 */
function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tags = post.tags ? post.tags.split(',') : [];

  return (
    <div className="bg-backgroundRed dark:bg-gray-800">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative h-48 w-full">
          {post.imageUrl ? (
            <>
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
              <h2 className="absolute bottom-0 left-0 w-full p-4 text-xl font-bold text-white z-10">
                {post.title}
              </h2>
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center px-4">
                {post.title}
              </h2>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            {post.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {formattedDate}
            </span>
            <div className="flex flex-wrap gap-1">
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
        </div>
      </Link>
    </div>
  );
}

export default BlogCard; 