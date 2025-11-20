"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Premium theme toggle component
 * Switches between dark and light mode (currently dark only per requirements)
 */
export default function ThemeToggle({ className = "" }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Always use dark mode per requirements
    document.documentElement.classList.add("dark");
    // Use a callback to set state after render
    setTimeout(() => setIsDark(true), 0);
  }, []);

  const toggleTheme = () => {
    // For now, keep dark mode only
    // Can be extended later for light mode support
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`glass-strong flex items-center justify-center rounded-xl p-2.5 transition-colors hover:bg-white/10 ${className}`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <motion.svg
          key="moon"
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          className="h-5 w-5 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </motion.svg>
      ) : (
        <motion.svg
          key="sun"
          initial={{ rotate: 90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          className="h-5 w-5 text-accent-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </motion.svg>
      )}
    </motion.button>
  );
}

