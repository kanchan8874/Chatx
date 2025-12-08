"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import UserBadge from "./UserBadge";

dayjs.extend(relativeTime);

/**
 * Premium sidebar user card for chat list
 * Shows user info, last message, unread count, and online status
 */
export default function SidebarUserCard({
  chat,
  user,
  isActive = false,
  isOnline = false,
  onClick,
}) {
  const otherUser = chat.members?.find((m) => m.id !== user?.id) || chat.members?.[0];
  const unreadCount = chat.unreadCount || 0;
  const lastMessage = chat.lastMessage;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative w-full cursor-pointer rounded-2xl p-4 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg ${
        isActive
          ? "bg-gradient-primary shadow-glow-primary"
          : "glass hover:bg-white/10 hover:shadow-lg"
      }`}
      aria-label={`Chat with ${otherUser?.username || "Unknown User"}${unreadCount > 0 ? `, ${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : ""}`}
      aria-pressed={isActive}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with Online Status */}
        <div className="flex-shrink-0">
          <UserBadge user={otherUser} isOnline={isOnline} size="md" showStatus={true} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`truncate text-sm font-semibold ${
                isActive ? "text-white" : "text-dark-text"
              }`}
            >
              {otherUser?.username || "Unknown User"}
            </h3>
            {lastMessage && (
              <span
                className={`flex-shrink-0 text-xs ${
                  isActive ? "text-white/70" : "text-dark-muted"
                }`}
              >
                {dayjs(lastMessage.createdAt).format("HH:mm")}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            {lastMessage ? (
              <>
                <p
                  className={`truncate text-xs ${
                    isActive ? "text-white/80" : "text-dark-muted"
                  }`}
                >
                  {lastMessage.text}
                </p>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gradient-primary text-white"
                    }`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </motion.span>
                )}
              </>
            ) : (
              <p
                className={`text-xs italic ${
                  isActive ? "text-white/60" : "text-dark-muted"
                }`}
              >
                No messages yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white"
        />
      )}

      {/* Hover Glow Effect */}
      {!isActive && (
        <div className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-primary opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-20" />
      )}
    </motion.button>
  );
}

