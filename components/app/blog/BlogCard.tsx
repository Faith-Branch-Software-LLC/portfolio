'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { motion } from 'motion/react';

interface BlogCardProps {
  post: BlogPost;
  index: number;
}

/**
 * Displays a card for a blog post with animations
 * @param post The blog post to display
 * @param index The index of the card in the list
 * @returns A component showing a summary of the blog post with animations
 */
function BlogCard({ post, index }: BlogCardProps) {
  const [delay, setDelay] = useState(index * 0.1);
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tags = post.tags ? post.tags.split(',') : [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelay(0);
    }, index*100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className="bg-backgroundRed dark:bg-gray-800 rounded-lg overflow-hidden shadow-card"
    >
      <Link href={`/blog/${post.slug}`}>
        <div className="flex flex-row md:flex-col">
          <motion.div 
            className="relative h-40 w-32 md:h-48 md:w-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {post.imageUrl ? (
              <>
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-black to-transparent opacity-70"
                  whileHover={{ opacity: 0.5 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.h2 
                  className="absolute bottom-0 left-0 w-full p-4 text-xl font-bold text-white z-10 hidden md:block"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  {post.title}
                </motion.h2>
              </>
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <h2 className="text-xl font-bold text-center px-4 hidden md:block">
                  {post.title}
                </h2>
              </div>
            )}
          </motion.div>
          <motion.div 
            className="p-4 flex-1 flex flex-col justify-between"
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <h2 className="text-md font-bold mb-1 md:hidden line-clamp-2">{post.title}</h2>
              <span className="opacity-60 text-xs mb-0 block md:hidden">
                {formattedDate}
              </span>
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 md:line-clamp-3">
                {post.description}
              </p>
            </div>
            <div className="hidden md:flex flex-row items-center justify-between gap-2">
              <span className="text-gray-500 opacity-60 dark:text-gray-400 text-xs">
                {formattedDate}
              </span>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <motion.span 
                    key={tag}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className="p-1 bg-[#aaaaaa] dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-2xs shadow-button"
                  >
                    {tag.trim()}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}

export default BlogCard; 