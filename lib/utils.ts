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
export function getContainerSize(width: number): 'mobile' | 'tablet' | 'desktop' {
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
  const baseline = height; // Use full height as baseline
  const spikeHeight = height * 0.8; // Use 80% of the height for spikes
  
  // Start path
  path.push(`M 0 0`);
  path.push(`L 0 ${baseline}`);
  
  // Generate first point
  let lastY = baseline - (Math.random() * spikeHeight);
  path.push(`L ${width / points} ${lastY}`);
  
  // Generate remaining points ensuring minimum variance
  for (let i = 2; i <= points; i++) {
    const x = (width / points) * i;
    let newY: number;
    
    // Keep generating Y values until we meet the variance requirement
    do {
      newY = baseline - (Math.random() * spikeHeight);
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

/**
 * Generates a CSS polygon clip-path with jagged left and right edges
 * for use as a page transition overlay. Uses percentage-based coordinates.
 * @param numPoints - Number of spike points per edge (default 15)
 * @param spikeDepth - Max spike deviation as percentage of width (default 5)
 * @param variance - Min difference between adjacent spike depths in % (default 1.5)
 */
export function generateVerticalSpikePath(
  numPoints: number = 15,
  spikeDepth: number = 5,
  variance: number = 1.5
): string {
  const leftPoints: string[] = [];
  const rightPoints: string[] = [];

  // Left edge: walk top to bottom, varying X between 0% and spikeDepth%
  let lastX = 0;
  for (let i = 0; i <= numPoints; i++) {
    const y = (i / numPoints) * 100;
    let x: number;
    do {
      x = Math.random() * spikeDepth;
    } while (i > 0 && Math.abs(x - lastX) < variance);
    leftPoints.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    lastX = x;
  }

  // Right edge: walk bottom to top, varying X between (100-spikeDepth)% and 100%
  lastX = 0;
  for (let i = numPoints; i >= 0; i--) {
    const y = (i / numPoints) * 100;
    let x: number;
    do {
      x = 100 - Math.random() * spikeDepth;
    } while (i < numPoints && Math.abs((100 - x) - lastX) < variance);
    rightPoints.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    lastX = 100 - x;
  }

  return `polygon(${[...leftPoints, ...rightPoints].join(', ')})`;
}