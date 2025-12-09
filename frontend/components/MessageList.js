"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import LoadingSkeleton from "./LoadingSkeleton";

function formatDay(timestamp) {
  const date = dayjs(timestamp);
  if (date.isSame(dayjs(), "day")) return "Today";
  if (date.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return date.format("MMMM D");
}

/**
 * Premium message list component with animations
 * WhatsApp-style chat bubbles with glassmorphism
 */
export default function MessageList({
  messages = [],
  currentUserId,
  typingUsers = [],
  isLoading,
  chatMembers = [],
}) {
  const endRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Remove duplicate messages based on ID
  const uniqueMessages = messages.filter((message, index, self) => 
    index === self.findIndex((m) => m.id === message.id)
  );

  // Group messages by day
  const grouped = uniqueMessages.reduce((acc, message) => {
    const key = formatDay(message.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(message);
    return acc;
  }, {});

  // Get sender info for each message
  const getSender = (message) => {
    if (message.sender?.id === currentUserId) {
      return null; // Don't show sender for own messages
    }
    return (
      chatMembers.find((m) => m.id === message.sender?.id) ||
      message.sender ||
      null
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-transparent via-dark-bg/50 to-transparent px-2 py-3 sm:px-3 sm:py-4 md:px-4 md:py-6 scrollbar-hide"
      role="log"
      aria-label="Message list"
      aria-live="polite"
      aria-atomic="false"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} variant="message" />
          ))}
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-full items-center justify-center py-8 sm:py-12"
          role="status"
          aria-live="polite"
        >
          <div className="text-center px-4">
            <div className="mb-3 text-3xl sm:text-4xl md:text-6xl" aria-hidden="true">💬</div>
            <p className="text-sm font-semibold text-dark-text sm:text-base md:text-lg">No messages yet</p>
            <p className="mt-2 text-xs text-dark-muted sm:text-sm md:text-base">Say hello to start the conversation 👋</p>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {Object.entries(grouped).map(([day, dayMessages]) => (
          <motion.section
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 sm:mb-8"
            aria-label={`Messages from ${day}`}
          >
            {/* Day Separator */}
            <div className="mb-4 flex items-center justify-center sm:mb-6">
              <div className="glass-strong rounded-full px-3 py-1 sm:px-4 sm:py-1.5">
                <time className="text-xs font-medium uppercase tracking-wider text-dark-muted sm:text-sm">
                  {day}
                </time>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-1">
              {dayMessages.map((message, index) => {
                const isOwn = message.sender?.id === currentUserId;
                const sender = getSender(message);
                const showAvatar = !isOwn && index === 0 || 
                  (index > 0 && dayMessages[index - 1].sender?.id !== message.sender?.id);

                // Ensure unique key: use message.id + index as fallback
                const uniqueKey = message.id || `${message._id || message.createdAt}-${index}`;

                return (
                  <MessageBubble
                    key={uniqueKey}
                    message={message}
                    isOwn={isOwn}
                    sender={showAvatar ? sender : null}
                  />
                );
              })}
            </div>
          </motion.section>
        ))}
      </AnimatePresence>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}

      <div ref={endRef} />
    </div>
  );
}
