"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPickerLib from "emoji-picker-react";

/**
 * Emoji Picker Component
 * Floating emoji picker with glassmorphism design
 */
export default function EmojiPicker({ onEmojiClick, isOpen, onClose }) {
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Prevent body scroll when picker is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Emoji Picker */}
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 left-4 z-50 sm:left-auto sm:right-4"
            role="dialog"
            aria-label="Emoji picker"
            aria-modal="true"
          >
            <div className="glass-panel rounded-2xl p-2 shadow-2xl">
              <EmojiPickerLib
                onEmojiClick={(emojiData) => {
                  onEmojiClick(emojiData.emoji);
                  onClose();
                }}
                theme="dark"
                width={320}
                height={400}
                previewConfig={{
                  showPreview: false,
                }}
                searchDisabled={false}
                skinTonesDisabled={false}
                lazyLoadEmojis={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

