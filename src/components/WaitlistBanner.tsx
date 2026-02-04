"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function WaitlistBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "founder" }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setEmail("");
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      } else {
        setStatus("error");
        setMessage(result.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      if (status !== "success") {
        setStatus("idle");
      }
    }, 5000);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#00f0ff] to-[#a855f7] text-black py-3 px-4 shadow-lg"
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm md:text-base font-medium">
              🚀 <strong>Next Batch:</strong> Applications open now - Free analysis for all founders
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {status === "success" ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 text-[#10b981] font-medium"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">You're on the list!</span>
              </motion.div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={status === "loading"}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/90 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-black/30 disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-4 py-1.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 transition disabled:opacity-50 whitespace-nowrap"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {status === "loading" ? "Joining..." : "Join Waitlist"}
                </motion.button>
              </>
            )}
          </form>

          <button
            onClick={() => setIsVisible(false)}
            className="text-black/70 hover:text-black transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {message && status === "error" && (
          <div className="container mx-auto mt-2">
            <p className="text-xs text-red-900">{message}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
