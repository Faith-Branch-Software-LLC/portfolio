import type { Metadata } from "next";
import "../globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Harvey Registry",
  description: "Registry for the Josiah Harvey and Makayla Neiswanger Wedding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={cn("bg-[#FFC0CB] min-h-screen absolute inset-0")}>
      {children}
    </div>
  );
}
