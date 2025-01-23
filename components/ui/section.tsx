"use client"

import { cn, generateSpikePath } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useElementDimensions } from '@/hooks/useElementDimensions';
import { Card, CardHeader, CardTitle } from "./card";
import { useLayout } from "@/lib/context/layoutContext";

/**
 * Creates a decorative section with spiky bottom border and shadow
 * @param children - Content to render inside the section
 * @param className - Additional CSS classes to apply
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
  const { width, height } = useElementDimensions(containerRef);
  const [path, setPath] = useState('M 0 0 L 0 100 L 100 100 L 100 0 Z');
  const { setTotalTranslation, setMaxLayer, maxLayer } = useLayout();
  const translation = layer * 160;

  useEffect(() => {
    if (width && height) {
      const adjustedHeight = layer === 4 ? height * 1.1 : height
      setPath(generateSpikePath(undefined, width, adjustedHeight));
    }
  }, [width, height, layer]);

  useEffect(() => {
    if (layer > maxLayer) {
      setMaxLayer(layer);
      setTotalTranslation(translation);
    }
  }, [layer, maxLayer, setMaxLayer, setTotalTranslation]);

  return (
    <div
      className="relative w-full overflow-visible"
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
          "flex flex-col items-center justify-center mx-0 relative bg-white w-full h-full overflow-visible gap-5 md:gap-8 p-5",
          "pb-48 md:pb-40",
          layer === 0 ? "pt-5" : "pt-48 md:pt-[160px]",
          className
        )}
        style={{
          clipPath: `path('${path}')`,
          zIndex: `calc(50 - ${layer})`
        }}
      >
        {children}
      </div>

      {/* Shadow element */}
      <div
        className="absolute inset-0 translate-y-[20px] blur-xl bg-gradient-to-b from-black/80 via-black/50 to-transparent overflow-visible"
        style={{
          clipPath: `path('${path}')`
        }}
      />
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <Card>
      <CardHeader className="p-2">
        <CardTitle className={cn("text-3xl md:text-4xl lg:text-5xl text-center", className)}>{children}</CardTitle>
      </CardHeader>
    </Card>
  );
}
