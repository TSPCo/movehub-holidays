import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Move Hub Holidays",
  description: "The Move Hub — staff holiday portal",
  icons: {
    icon: "/logo-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#080C18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
