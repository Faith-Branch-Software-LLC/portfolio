import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/app/header";

export const metadata: Metadata = {
  title: "Faith Branch Blog",
  description: "Blog of information I feel is fun or important to share",
  keywords: "software development blog, web development tips, programming insights, Faith Branch Software blog",
  authors: [{ name: "Faith Branch Software LLC" }],
  creator: "Faith Branch Software LLC",
  publisher: "Faith Branch Software LLC",
  metadataBase: new URL('https://faithbranch.com'),
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://faithbranch.com/blog',
    title: 'Faith Branch Blog',
    description: 'Blog of information I feel is fun or important to share',
    siteName: 'Faith Branch Software LLC',
    images: [
      {
        url: '/icon.svg',
        width: 1200,
        height: 630,
        alt: 'Faith Branch Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faith Branch Blog',
    description: 'Blog of information I feel is fun or important to share',
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Root layout component for the blog section that includes header and footer
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={cn("min-h-screen flex flex-col")}>
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
