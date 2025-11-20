"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * User badge component with online status indicator
 * Shows avatar, username, and online/offline status
 */
export default function UserBadge({ user, isOnline = false, size = "md", showStatus = true }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const statusSize = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-3.5 w-3.5",
  };

  return (
    <div className="relative inline-flex items-center">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        {/* Avatar */}
        <div className={`relative ${sizeClasses[size]} overflow-hidden rounded-full border-2 ${
          isOnline ? "border-accent-500/50 ring-2 ring-accent-500/30" : "border-dark-border/50"
        }`}>
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username || "User"}
              width={size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64}
              height={size === "sm" ? 32 : size === "md" ? 40 : size === "lg" ? 48 : 64}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-xs font-semibold text-white">
              {(user?.username || "U")[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Online Status Indicator */}
        {showStatus && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute bottom-0 right-0 ${statusSize[size]} rounded-full border-2 border-dark-bg ${
              isOnline ? "bg-accent-500" : "bg-dark-muted"
            }`}
          >
            {isOnline && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-accent-500 opacity-50"
              />
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

