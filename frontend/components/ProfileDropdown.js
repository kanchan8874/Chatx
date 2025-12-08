"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import UserBadge from "./UserBadge";
import { logout } from "@/lib/profile";

/**
 * Profile dropdown component with logout
 * Premium UI with glassmorphism
 */
export default function ProfileDropdown({ user, isOnline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to logout");
      // Still redirect to login
      router.push("/login");
      router.refresh();
    }
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glass-strong flex items-center gap-3 rounded-2xl p-2 transition-all hover:bg-white/10"
      >
        <UserBadge user={user} isOnline={isOnline} size="md" showStatus={true} />
        <div className="hidden text-left sm:block">
          <p className="text-xs text-dark-muted">Logged in as</p>
          <p className="text-sm font-semibold text-dark-text">{user?.username || "User"}</p>
        </div>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="h-4 w-4 text-dark-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl bg-dark-surface/95 backdrop-blur-2xl shadow-2xl border border-white/10 overflow-hidden"
          >
            <div className="p-2">
              {/* Profile Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProfileClick}
                className="glass-strong w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-white">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-dark-text">View Profile</p>
                  <p className="text-xs text-dark-muted">Edit your information</p>
                </div>
              </motion.button>

              {/* Divider */}
              <div className="my-2 h-px bg-white/10" />

              {/* Logout Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="glass-strong w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-red-500/20 hover:border-red-500/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-400">Logout</p>
                  <p className="text-xs text-dark-muted">Sign out of your account</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

