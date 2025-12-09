"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UserBadge from "./UserBadge";

/**
 * Profile button component - directly navigates to profile page
 * Simple and clean design
 */
export default function ProfileDropdown({ user, isOnline = false }) {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleProfileClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleProfileClick();
        }
      }}
      aria-label={`View ${user?.username || "User"} profile`}
      className="glass-strong flex items-center gap-3 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-surface w-full"
    >
      <UserBadge user={user} isOnline={isOnline} size="md" showStatus={true} />
      <div className="hidden text-left sm:block flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-dark-muted truncate" style={{ fontSize: '12px' }}>Logged in as</p>
        <p className="text-sm sm:text-base font-semibold text-dark-text truncate" style={{ fontSize: '15px' }}>{user?.username || "User"}</p>
      </div>
      {/* Profile Icon Indicator */}
      <svg
        className="h-4 w-4 text-dark-muted flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </motion.button>
  );
}

