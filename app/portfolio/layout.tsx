import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/app/header";

export const metadata: Metadata = {
  title: "Faith Branch Portfolio",
  description: "Explore our portfolio of web and software projects",
  keywords: "portfolio, web development, software projects, Faith Branch Software",
  authors: [{ name: "Faith Branch Software LLC" }],
  creator: "Faith Branch Software LLC",
  publisher: "Faith Branch Software LLC",
  metadataBase: new URL('https://faithbranch.com'),
  alternates: {
    canonical: '/portfolio',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://faithbranch.com/portfolio',
    title: 'Faith Branch Portfolio',
    description: 'Explore our portfolio of web and software projects',
    siteName: 'Faith Branch Software LLC',
    images: [
      {
        url: '/icon.svg',
        width: 1200,
        height: 630,
        alt: 'Faith Branch Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faith Branch Portfolio',
    description: 'Explore our portfolio of web and software projects',
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

export default function PortfolioLayout({
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
