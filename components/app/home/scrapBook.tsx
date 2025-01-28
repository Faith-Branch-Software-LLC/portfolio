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
      description: 'In 2023, I started working on Homework Muffin as a Senior Design Project. It is a web/mobile application that helps students organize their homework and study for exams.',
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
      description: 'The first project since the start of the company. We were tasked with creating a website for a local fence company. We were able to create a really nice website with admin tools to help manage the website after the project was completed.',
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
      description: 'EyeOnFi is a financial forecasting tool that helps everyday people make better financial decisions. By imputing your financial data, EyeOnFi will help you forecast your financial future, helping to make informed decisions about your finances.',
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
      
      <Card className="w-80">
        <CardHeader>
          <CardTitle>
            {currentSpreadInfo?.title || 'My Portfolio'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{currentSpreadInfo?.description}</p>
          {currentSpreadInfo?.url && (
            <a 
              href={currentSpreadInfo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 inline-block text-teal hover:underline"
            >
              Visit Project →
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}