"use client";

import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import UserBadge from "./UserBadge";

dayjs.extend(relativeTime);

/**
 * Premium chat header component
 * Linear.app-inspired design with glassmorphism
 */
export default function ChatHeader({ chat, onlineUsers = [], onBack, onMenuClick }) {
  if (!chat) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      className="glass-panel flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4"
      role="banner"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary-400">ChatX</p>
        <h2 className="text-lg font-semibold text-dark-text sm:text-xl">
            Select a chat to start messaging
          </h2>
        </div>
      </motion.header>
    );
  }

  const peer =
    chat.members?.find((member) => member.id !== chat.currentUserId) ||
    chat.members?.[0];
  const isOnline = onlineUsers.includes(peer?.id);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel flex items-center justify-between border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4"
      role="banner"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
        {/* Menu Button (Mobile - Opens Sidebar) */}
        {onMenuClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="glass-strong flex-shrink-0 rounded-xl p-2 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg touch-manipulation lg:hidden"
            aria-label="Open chat list"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </motion.button>
        )}

        {/* Back Button (Mobile - Only when chat is selected) */}
        {onBack && chat && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="glass-strong flex-shrink-0 rounded-xl p-2 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg touch-manipulation lg:hidden"
            aria-label="Go back to chat list"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </motion.button>
        )}

        {/* User Avatar */}
        <UserBadge user={peer} isOnline={isOnline} size="lg" showStatus={true} />

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-dark-text sm:text-base md:text-lg" style={{ fontSize: '16px' }}>{peer?.username || "Unknown"}</h3>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div
              className={`h-1.5 w-1.5 flex-shrink-0 rounded-full sm:h-2 sm:w-2 ${
                isOnline ? "bg-accent-500 animate-pulse-slow" : "bg-dark-muted"
              }`}
              aria-label={isOnline ? "Online" : "Offline"}
              role="status"
            />
            <p className="truncate text-sm text-dark-muted sm:text-sm" style={{ fontSize: '13px' }}>
              {isOnline
                ? "Online"
                : chat.lastMessage?.createdAt
                  ? `Last active ${dayjs(chat.lastMessage.createdAt).fromNow()}`
                  : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="hidden flex-shrink-0 items-center gap-2 md:flex md:gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass-strong rounded-xl px-3 py-2 text-xs font-medium text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg touch-manipulation md:px-4"
          aria-label="Secure chat information"
          title="End-to-end encrypted"
        >
          <span className="flex items-center gap-1.5 md:gap-2">
            <svg className="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="hidden lg:inline">Secure</span>
          </span>
        </motion.button>
      </div>
    </motion.header>
  );
}
