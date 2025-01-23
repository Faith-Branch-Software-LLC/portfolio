import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { LayoutProvider } from "@/lib/context/layoutContext";

export const metadata: Metadata = {
  title: "Faith Branch Software LLC",
  description: "Portfolio for Faith Branch Software LLC. Please view our current and past projects. Contact us for information on how to get started with your project!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <LayoutProvider>
        <body className={cn("bg-teal min-h-screen")}>
          <main className="relative">{children}</main>
          <Toaster />
        </body>
      </LayoutProvider>
    </html>
  );
}
