"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/**
 * Premium search box with glassmorphism and smooth animations
 */
export default function SearchBox({ onSearch, placeholder = "Search chats...", className = "" }) {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearch?.(newValue);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <label htmlFor="search-input" className="sr-only">
        {placeholder || "Search"}
      </label>
      <div
        className={`glass-strong relative flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all duration-300 sm:gap-3 sm:px-4 sm:py-3 ${
          isFocused
            ? "ring-2 ring-primary-500/50 shadow-glow-primary"
            : "hover:ring-1 hover:ring-white/20"
        }`}
      >
        {/* Search Icon */}
        <svg
          className={`h-4 w-4 transition-colors duration-300 sm:h-5 sm:w-5 ${
            isFocused ? "text-primary-400" : "text-dark-muted"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Input */}
        <input
          id="search-input"
          type="search"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-dark-text placeholder-dark-muted outline-none focus:ring-0 sm:text-base"
          style={{ fontSize: '15px' }}
          aria-label={placeholder || "Search"}
        />

        {/* Clear Button */}
        {value && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              setValue("");
              onSearch?.("");
            }}
            className="rounded-full p-1.5 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
            aria-label="Clear search"
            title="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

