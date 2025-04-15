'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
  pageSize: number;
}

interface BlogPaginationProps {
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for blog posts with enhanced styling and animations
 * @param pagination The pagination metadata
 * @param onPageChange Callback function when page changes
 * @returns A pagination component with enhanced styling and animations
 */
export default function BlogPagination({ pagination, onPageChange }: BlogPaginationProps) {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={hasPreviousPage ? { scale: 1.05, backgroundColor: "#2E294E" } : {}}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          transition={{ duration: 0.05 }}
          className={`px-4 py-2 rounded-lg font-gelasio transition-all duration-300 ${
            hasPreviousPage
              ? 'hover:shadow-button text-white'
              : 'cursor-not-allowed text-offWhite'
          }`}
        >
          <div className="flex items-center gap-2">
            {hasPreviousPage ? (
              <motion.span
                animate={{ x: [-2, 2, -2] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ←
              </motion.span>
            ) : (
              <span>←</span>
            )}
          </div>
        </motion.button>
        
        <div className="flex gap-1 p-2 rounded-lg">
          {getPageNumbers().map((page) => (
            <motion.button
              key={page}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg font-gelasio transition-all duration-300 ${
                page === currentPage
                  ? 'bg-darkPurple text-white shadow-button'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={hasNextPage ? { scale: 1.05, backgroundColor: "#2E294E" } : {}}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
          transition={{ duration: 0.05 }}
          className={`px-4 py-2 rounded-lg font-gelasio transition-all duration-300 ${
            hasNextPage
              ? 'hover:shadow-button text-white'
              : 'cursor-not-allowed text-offWhite'
          }`}
        >
          <div className="flex items-center gap-2">
            {hasNextPage ? (
              <motion.span
                animate={{ x: [-2, 2, -2] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                →
              </motion.span>
            ) : (
              <span>→</span>
            )}
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
} 