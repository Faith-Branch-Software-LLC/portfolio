import React from 'react';
import Link from 'next/link';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export interface PaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BlogPaginationProps {
  pagination: PaginationMetadata;
}

/**
 * Component for blog pagination
 * @param pagination The pagination metadata
 * @returns A pagination component for the blog
 */
function BlogPagination({ pagination }: BlogPaginationProps) {
  const { totalPages, currentPage, hasNextPage, hasPreviousPage } = pagination;
  
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Add first page
      pageNumbers.push(1);
      
      // Calculate start and end for middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at the beginning or end
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis-end');
      }
      
      // Add last page if not the first
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <Pagination>
      <PaginationContent>
        {hasPreviousPage && (
          <PaginationItem>
            <Link href={`/blog?page=${currentPage - 1}`} passHref legacyBehavior>
              <PaginationPrevious />
            </Link>
          </PaginationItem>
        )}
        
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === 'ellipsis-start' || pageNumber === 'ellipsis-end') {
            return (
              <PaginationItem key={`${pageNumber}-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          return (
            <PaginationItem key={pageNumber}>
              <Link href={`/blog?page=${pageNumber}`} passHref legacyBehavior>
                <PaginationLink isActive={pageNumber === currentPage}>
                  {pageNumber}
                </PaginationLink>
              </Link>
            </PaginationItem>
          );
        })}
        
        {hasNextPage && (
          <PaginationItem>
            <Link href={`/blog?page=${currentPage + 1}`} passHref legacyBehavior>
              <PaginationNext />
            </Link>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}

export default BlogPagination; 