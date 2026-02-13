import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { LayoutProvider } from "@/lib/context/layoutContext";
import PageTransitionProvider from "@/components/ui/PageTransition";

export const metadata: Metadata = {
  title: "Faith Branch Software LLC",
  description: "Portfolio for Faith Branch Software LLC. Please view our current and past projects. Contact us for information on how to get started with your project!",
  keywords: "software development, web development, portfolio, Faith Branch Software, custom software solutions",
  authors: [{ name: "Faith Branch Software LLC" }],
  creator: "Faith Branch Software LLC",
  publisher: "Faith Branch Software LLC",
  metadataBase: new URL('https://faithbranch.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://faithbranch.com',
    title: 'Faith Branch Software LLC',
    description: 'Portfolio for Faith Branch Software LLC. Please view our current and past projects. Contact us for information on how to get started with your project!',
    siteName: 'Faith Branch Software LLC',
    images: [
      {
        url: '/icon.svg',
        width: 1200,
        height: 630,
        alt: 'Faith Branch Software LLC',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faith Branch Software LLC',
    description: 'Portfolio for Faith Branch Software LLC. Please view our current and past projects. Contact us for information on how to get started with your project!',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD structured data for organization
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Faith Branch Software LLC',
    url: 'https://faithbranch.com',
    logo: 'https://faithbranch.com/icon.svg',
    description: 'Portfolio for Faith Branch Software LLC. Please view our current and past projects. Contact us for information on how to get started with your project!',
    sameAs: [
      // Add social media profiles here when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <LayoutProvider>
          <body className={cn("bg-teal min-h-screen")}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <PageTransitionProvider>
              <main className="relative">{children}</main>
            </PageTransitionProvider>
            <Toaster />
          </body>
      </LayoutProvider>
    </html>
  );
}
