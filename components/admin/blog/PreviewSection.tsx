'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { generateSpikePath } from '@/lib/utils';
import { useLayout } from '@/lib/context/layoutContext';

const SPIKE = 97;
const TRANS = 100;

export default function PreviewSection({
  children,
  index,
  className,
}: {
  children: React.ReactNode;
  index: number;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState('M 0 0 L 0 100 L 100 100 L 100 0 Z');
  const { setTotalTranslation, setMaxLayer, maxLayer } = useLayout();
  const translation = index * TRANS;

  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(() => {
      if (ref.current) {
        setPath(generateSpikePath(undefined, ref.current.offsetWidth, SPIKE));
      }
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (index > maxLayer) {
      setMaxLayer(index);
      setTotalTranslation(translation);
    }
  }, [index, maxLayer, setMaxLayer, setTotalTranslation, translation]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'visible',
        paddingBottom: `${SPIKE}px`,
        transform: `translateY(-${translation}px)`,
        zIndex: `calc(50 - ${index})`,
      }}
    >
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-visible',
          index === 0 ? 'pt-5' : 'pt-[100px]',
          className,
        )}
        style={{ padding: '20px 0', paddingTop: index === 0 ? '20px' : '100px' }}
      >
        {children}
      </div>

      {/* Spike */}
      <div
        className={className}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${SPIKE}px`,
          clipPath: `path('${path}')`,
          zIndex: `calc(50 - ${index})`,
        }}
      />

      {/* Shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${SPIKE}px`,
          transform: 'translateY(20px)',
          filter: 'blur(16px)',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.5), transparent)',
          clipPath: `path('${path}')`,
          zIndex: `calc(50 - ${index + 1})`,
        }}
      />
    </div>
  );
}
