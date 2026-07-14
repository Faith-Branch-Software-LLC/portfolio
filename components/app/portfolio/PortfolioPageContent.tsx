'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Section from '@/components/ui/section';
import { useLayout } from '@/lib/context/layoutContext';
import Footer from '@/components/app/footer';
import { motion } from 'motion/react';
import { Hand, ScrapColors, StickyNote, TapeColor } from '@/components/app/scrapbookElements';
import type { PortfolioItem } from '@prisma/client';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

function Lightbox({
  images,
  title,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  title: string;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const prev = () => onIndexChange((index - 1 + count) % count);
  const next = () => onIndexChange((index + 1) % count);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && count > 1) prev();
      if (e.key === 'ArrowRight' && count > 1) next();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, index, count]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
        style={{ background: '#F4EAD4' }}
      >
        <X size={20} />
      </button>
      <div className="relative w-full h-full max-w-[92vw] max-h-[90vh] cursor-default" onClick={(e) => e.stopPropagation()}>
        <Image src={images[index]} alt={`${title} screenshot ${index + 1}`} fill className="object-contain" sizes="92vw" />
      </div>
      {count > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous image"
            className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: '#F4EAD4' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next image"
            className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: '#F4EAD4' }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

function resolveTapeColor(name: string): TapeColor {
  const map: Record<string, TapeColor> = {
    Orange: TapeColor.Orange,
    Purple: TapeColor.Purple,
    Teal: TapeColor.Teal,
    Red: TapeColor.Red,
  };
  return map[name] ?? TapeColor.Orange;
}

function fitBox(ratio: number, maxW: number, maxH: number) {
  let w = maxH * ratio;
  let h = maxH;
  if (w > maxW) {
    w = maxW;
    h = maxW / ratio;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [ratios, setRatios] = useState<Record<number, number>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const count = images.length;
  const ratio = ratios[idx] ?? 3 / 4;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const { w: boxW, h: boxH } = fitBox(ratio, isDesktop ? 420 : 300, isDesktop ? 430 : 340);

  if (count === 0) {
    return (
      <div className="relative w-[220px] h-[340px] md:w-[300px] md:h-[430px] mx-auto md:mx-0 flex items-center justify-center">
        <div
          className="w-full h-full rounded-lg flex items-center justify-center shadow-card"
          style={{ background: '#f3ead4', transform: 'rotate(-2deg)' }}
        >
          <div className="text-center p-6">
            <p className="font-fraunces font-black text-2xl mb-2">{title}</p>
            <p className="font-gelasio text-sm opacity-60">Screenshots coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  if (count === 1) {
    return (
      <>
        <div
          className="relative mx-auto md:mx-0 rounded-lg overflow-hidden shadow-card cursor-pointer transition-[width,height] duration-300"
          style={{ transform: 'rotate(-2deg)', width: boxW, height: boxH }}
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={images[0]}
            alt={`${title} screenshot`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 300px, 420px"
            onLoad={(e) => {
              const img = e.currentTarget;
              setRatios((r) => ({ ...r, 0: img.naturalWidth / img.naturalHeight }));
            }}
          />
        </div>
        {lightboxOpen && (
          <Lightbox images={images} title={title} index={0} onIndexChange={() => {}} onClose={() => setLightboxOpen(false)} />
        )}
      </>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + count) % count);
  const next = () => setIdx((i) => (i + 1) % count);

  return (
    <div className="relative mx-auto md:mx-0" style={{ width: boxW }}>
      <div
        className="relative rounded-lg overflow-hidden shadow-card cursor-pointer transition-[width,height] duration-300"
        style={{ transform: 'rotate(-2deg)', width: boxW, height: boxH }}
        onClick={() => setLightboxOpen(true)}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-400"
            style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? 'auto' : 'none' }}
          >
            <Image
              src={src}
              alt={`${title} screenshot ${i + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 300px, 420px"
              onLoad={(e) => {
                const img = e.currentTarget;
                setRatios((r) => ({ ...r, [i]: img.naturalWidth / img.naturalHeight }));
              }}
            />
          </div>
        ))}
      </div>
      {lightboxOpen && (
        <Lightbox images={images} title={title} index={idx} onIndexChange={setIdx} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={prev}
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-card transition-transform hover:scale-110 active:scale-95"
          style={{ background: '#F4EAD4', border: '1.5px solid rgba(0,0,0,0.1)' }}
          aria-label="Previous image"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Image ${i + 1}`}
              style={{
                width: i === idx ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === idx ? '#F4EAD4' : 'rgba(255,255,255,0.35)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 0.2s, background 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-card transition-transform hover:scale-110 active:scale-95"
          style={{ background: '#F4EAD4', border: '1.5px solid rgba(0,0,0,0.1)' }}
          aria-label="Next image"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function PortfolioPageContent({ items }: { items: PortfolioItem[] }) {
  const { totalTranslation } = useLayout();

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Section className="bg-backgroundRed" layer={1}>
          <div className="text-center py-20">
            <p className="font-fraunces font-black text-3xl text-white mb-4">Portfolio coming soon</p>
            <p className="font-gelasio text-white/70">Check back soon for our latest projects.</p>
          </div>
        </Section>
        <Footer layer={2} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ marginBottom: `-${totalTranslation}px` }}
    >
      {items.map((item, i) => {
        const images = (item.images as string[]) ?? [];
        return (
          <Section key={item.id} className={i % 2 === 1 ? 'bg-backgroundRed' : 'bg-teal'} layer={i + 1}>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,420px)_1fr] gap-12 md:gap-20 w-full max-w-6xl mx-auto items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <ImageCarousel images={images} title={item.title} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <StickyNote rot={item.noteRot} tapeColor={resolveTapeColor(item.tapeColor)}>
                  <h2 className="text-3xl md:text-4xl font-black font-fraunces mb-3">
                    {item.title}
                  </h2>
                  <p className="font-gelasio text-base leading-relaxed mb-5">
                    {item.description}
                  </p>
                  <Hand
                    color={ScrapColors.red}
                    size={24}
                    rot={-3}
                    href={item.url}
                    style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    Visit project →
                  </Hand>
                </StickyNote>
              </motion.div>
            </div>
          </Section>
        );
      })}
      <Footer layer={items.length + 1} />
    </motion.div>
  );
}
