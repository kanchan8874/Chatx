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
export default function ChatHeader({ chat, onlineUsers = [], onBack }) {
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
      className="glass-panel flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4"
      role="banner"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Back Button (Mobile) */}
        {onBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="glass-strong mr-2 rounded-xl p-2 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg lg:hidden"
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
        <div>
          <h3 className="text-base font-semibold text-dark-text sm:text-lg">{peer?.username || "Unknown"}</h3>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isOnline ? "bg-accent-500 animate-pulse-slow" : "bg-dark-muted"
              }`}
              aria-label={isOnline ? "Online" : "Offline"}
              role="status"
            />
            <p className="text-xs text-dark-muted sm:text-sm">
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
      <div className="hidden items-center gap-3 md:flex">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass-strong rounded-xl px-4 py-2 text-xs font-medium text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg"
          aria-label="Secure chat information"
          title="End-to-end encrypted"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secure
          </span>
        </motion.button>
      </div>
    </motion.header>
  );
}
