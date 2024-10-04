import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={cn(inter.className, "bg-backgroundRed")}>
        <main>{children}</main>
      </body>
    </html>
  );
}
