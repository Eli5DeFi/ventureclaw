import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VentureClaw - AI Shark Tank Accelerator",
  description:
    "Pitch your startup to AI sharks. Get judged. Get funded through futarchy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-[var(--border)] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              Venture<span className="text-[var(--accent)]">Claw</span>
            </a>
            <div className="flex gap-6 text-sm text-[var(--text-muted)]">
              <a href="/pitch" className="hover:text-white transition">
                Pitch
              </a>
              <a href="/tank" className="hover:text-white transition">
                Shark Tank
              </a>
              <a href="/launchpad" className="hover:text-white transition">
                Launchpad
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
