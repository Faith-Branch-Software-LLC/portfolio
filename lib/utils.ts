import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines the size category based on container width
 * @param width - Container width in pixels
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
function getContainerSize(width: number): 'mobile' | 'tablet' | 'desktop' {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Generates a spiky path for decorative borders
 * @param numPoints - Number of spikes to generate (if not provided, based on container width)
 * @param width - Width of the container in pixels
 * @param height - Height of the container in pixels
 * @param distance - Maximum distance spikes can deviate from baseline in pixels (default 35)
 * @param variance - Minimum difference in height between adjacent points (default 10)
 */
export function generateSpikePath(
  numPoints: number | undefined,
  width: number = 100,
  height: number = 100,
  distance: number = 35,
  variance: number = 10
) {
  // Determine number of points based on container width if not provided
  let points: number;
  if (numPoints) {
    points = numPoints;
  } else {
    const containerSize = getContainerSize(width);
    points = containerSize === 'mobile' ? 10 : containerSize === 'tablet' ? 15 : 20;
  }
  
  const path = [];
  const baseline = height * 0.9;
  
  // Start path
  path.push(`M 0 0`);
  path.push(`L 0 ${baseline}`);
  
  // Generate first point
  let lastY = baseline + (Math.random() * distance * 2 - distance);
  path.push(`L ${width / points} ${lastY}`);
  
  // Generate remaining points ensuring minimum variance
  for (let i = 2; i <= points; i++) {
    const x = (width / points) * i;
    let newY: number;
    
    // Keep generating Y values until we meet the variance requirement
    do {
      newY = baseline + (Math.random() * distance * 2 - distance);
    } while (Math.abs(newY - lastY) < variance);
    
    path.push(`L ${x} ${newY}`);
    lastY = newY;
  }
  
  // Complete the shape
  path.push(`L ${width} ${baseline}`);
  path.push(`L ${width} 0`);
  path.push('Z');
  
  return path.join(' ');
}