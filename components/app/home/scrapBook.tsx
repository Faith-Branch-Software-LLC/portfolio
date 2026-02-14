'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageInfo {
  image: string;
  spreadIndex: number; // Index to group pages into spreads
  title?: string;
  description?: string;
  url?: string;
}

export default function ScrapBook() {
  const bookRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const [currentSpread, setCurrentSpread] = useState(0);

  const scrapBookPages: PageInfo[] = [
    {
      image: '/scrapBookImages/cover.jpg',
      spreadIndex: 0,
      title: 'Scrap Book',
      description: 'Enjoy looking through some of our projects!',
    },
    {
      image: '/scrapBookImages/hwm-1.jpg',
      spreadIndex: 1,
      title: 'Homework Muffin',
      description: 'A web and mobile application that helps students organize homework and study for exams. Built as a Senior Design Project in 2023.',
      url: 'https://homeworkmuffin.com'
    },
    {
      image: '/scrapBookImages/hwm-2.jpg',
      spreadIndex: 1,
    },
    {
      image: '/scrapBookImages/afc-1.jpg',
      spreadIndex: 2,
      title: 'Austintown Fence',
      description: 'Our first client project\u2014a complete website for a local fence company, including admin tools for ongoing content management.',
      url: 'https://austintownfence.org'
    },
    {
      image: '/scrapBookImages/afc-2.jpg',
      spreadIndex: 2,
    },
    {
      image: '/scrapBookImages/eof-1.jpg',
      spreadIndex: 3,
      title: 'EyeOnFi',
      description: 'A financial forecasting tool that helps everyday people make smarter decisions by visualizing and projecting their financial future.',
      url: 'https://app.eyeonfi.com'
    },
    {
      image: '/scrapBookImages/eof-2.jpg',
      spreadIndex: 3,
    },
    {
      image: '/scrapBookImages/cover-back.jpg',
      spreadIndex: 4,
      title: 'Thank You',
      description: 'Thanks for viewing our scrap book!',
    }
  ];

  useEffect(() => {
    if (bookRef.current && !pageFlipRef.current) {
      // Initialize PageFlip
      pageFlipRef.current = new PageFlip(bookRef.current, {
        width: 550, // Width of the book
        height: 733, // Height of the book
        size: "stretch",
        maxWidth: 1000,
        maxHeight: 1333,
        minWidth: 300,
        minHeight: 400,
        showCover: true,
        drawShadow: true,
        flippingTime: 1000,
        usePortrait: true,
        startZIndex: 0,
        autoSize: true,
        maxShadowOpacity: 1,
        mobileScrollSupport: true,
        swipeDistance: 30,
        clickEventForward: true,
        useMouseEvents: true,
      });

      // Load the pages
      pageFlipRef.current.loadFromHTML(document.querySelectorAll(".page"));
      
      // Add page flip event listener
      pageFlipRef.current.on('flip', (e) => {
        setCurrentSpread(Math.ceil(e.data / 2));
      });
    }

    // Cleanup
    return () => {
      if (pageFlipRef.current) {
        pageFlipRef.current.destroy();
      }
    };
  }, []);

  // Get current spread information
  const currentSpreadInfo = scrapBookPages.find(page => page.title && page.spreadIndex === currentSpread);

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-start gap-8">
      <div id="book" ref={bookRef} className="flex-1">
        {/* Cover */}
        <div className="page" data-density="hard">
          <img 
            src={scrapBookPages[0].image} 
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
          
        {/* Inner pages */}
        {scrapBookPages.slice(1, -1).map((page, index) => (
          <div key={index} className="page">
            <img 
              src={page.image} 
              alt={`Page ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
          
        {/* Back cover */}
        <div className="page" data-density="hard">
          <img 
            src={scrapBookPages[scrapBookPages.length - 1].image} 
            alt="Back Cover"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <Card className="w-80 self-center">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            {currentSpreadInfo?.title || 'Our Portfolio'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="leading-relaxed">{currentSpreadInfo?.description}</p>
          {currentSpreadInfo?.url && (
            <a 
              href={currentSpreadInfo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-teal font-semibold font-fraunces hover:underline"
            >
              Visit Project
              <span aria-hidden="true">{'\u2192'}</span>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
