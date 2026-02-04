import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WaitlistBanner from "@/components/WaitlistBanner";
import Header from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VentureClaw | YCombinator Powered by AI Agents",
  description: "Apply free. Get AI-powered analysis. Join our batch. Build with AI agent swarms. The future of startup acceleration is here.",
  keywords: ["AI accelerator", "startup funding", "YCombinator alternative", "pitch analysis", "venture capital", "seed funding"],
  openGraph: {
    title: "VentureClaw | YCombinator Powered by AI Agents",
    description: "Apply free. Get AI-powered analysis. Join our batch. Build with AI agent swarms.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <WaitlistBanner />
        <Header />
        <div className="pt-32">
          {children}
        </div>
      </body>
    </html>
  );
}
