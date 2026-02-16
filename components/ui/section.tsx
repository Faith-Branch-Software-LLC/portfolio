"use client"

import { cn, generateSpikePath } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useElementDimensions } from '@/hooks/useElementDimensions';
import { useLayout } from "@/lib/context/layoutContext";

/**
 * Creates a decorative section with spiky bottom border and shadow
 * @param children - Content to render inside the section
 * @param className - Additional CSS classes to apply
 * @param id - Optional ID for the section
 * @param layer - Optional layer number for stacking (default: 0)
 */
export default function Section({
  children,
  layer = 0,
  className,
  id = ""
}: {
  children: React.ReactNode,
  layer?: number,
  className?: string,
  id?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [path, setPath] = useState('M 0 0 L 0 100 L 100 100 L 100 0 Z');
  const { setTotalTranslation, setMaxLayer, maxLayer } = useLayout();
  const translation = dimensions.width > 768 ? layer * 150 : layer * 100;

  useEffect(() => {
    if (!containerRef.current) return;

    function updateDimensions() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    }

    // Initial measurement
    updateDimensions();

    // Create ResizeObserver for content changes
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(containerRef.current);

    // Listen for window resize events
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (dimensions.width) {
      const clipHeight = dimensions.width > 768 ? 150 : 100;
      setPath(generateSpikePath(undefined, dimensions.width, clipHeight));
    }
  }, [dimensions]);

  useEffect(() => {
    if (layer > maxLayer) {
      setMaxLayer(layer);
      setTotalTranslation(translation);
    }
  }, [layer, maxLayer, setMaxLayer, setTotalTranslation, translation]);

  return (
    <div
      className="relative w-full overflow-visible bg-transparent pb-[97px] md:pb-[147px]"
      style={{
        transform: `translateY(-${translation}px)`,
        zIndex: `calc(50 - ${layer})`
      }}
    >
      {/* Main content */}
      <div
        id={id}
        ref={containerRef}
        className={cn(
          "flex flex-col items-center justify-center relative bg-transparent w-full h-full overflow-visible gap-5 md:gap-8 p-5 pb-4",
          layer === 0 ? "pt-5" : "pt-[100px] md:pt-[150px]",
          className
        )}
      >
        {children}
      </div>

      {/* Clipping container */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-[100px] md:h-[150px]",
          className
        )}
        style={{
          clipPath: `path('${path}')`,
          zIndex: `calc(50 - ${layer})`
        }}
      >
        <div className="absolute inset-0" />
      </div>

      {/* Shadow element */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[100px] md:h-[150px] translate-y-[20px] blur-xl bg-gradient-to-b from-black/80 via-black/50 to-transparent"
        style={{
          clipPath: `path('${path}')`,
          zIndex: `calc(50 - ${layer + 1})`
        }}
      />
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h2 className={cn("text-3xl md:text-4xl lg:text-5xl text-center font-semibold font-fraunces", className)}>
      {children}
    </h2>
  );
}
