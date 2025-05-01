import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/app/header";

export const metadata: Metadata = {
  title: "Faith Branch Blog",
  description: "Blog of information I feel is fun or important to share",
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
