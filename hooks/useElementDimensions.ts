'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to get element dimensions
 * @param elementRef - Reference to the element to measure
 * @returns Object containing width and height of the element
 */
export function useElementDimensions(elementRef: React.RefObject<HTMLElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = useCallback(() => {
    if (elementRef.current) {
      const { width, height } = elementRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [elementRef]);

  useEffect(() => {
    updateDimensions();

    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  return dimensions;
} 