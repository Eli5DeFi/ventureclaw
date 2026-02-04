"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Apply", href: "/pitch" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Features", href: "/#features" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="fixed top-16 left-0 right-0 z-40 bg-black/50 backdrop-blur-md border-b border-[var(--glass-border)]">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="text-xl font-bold bg-gradient-to-r from-[#00f0ff] to-[#a855f7] bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              VentureClaw 🦾
            </motion.div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    className={`text-sm font-medium transition ${
                      isActive
                        ? "text-[#00f0ff]"
                        : "text-[var(--text-secondary)] hover:text-white"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.name}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* CTA Button */}
          {session ? (
            <Link href="/dashboard">
              <motion.button
                className="btn-primary px-6 py-2 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.button>
            </Link>
          ) : (
            <Link href="/auth/signin">
              <motion.button
                className="btn-primary px-6 py-2 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
