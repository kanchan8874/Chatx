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

  // Group messages by day
  const grouped = messages.reduce((acc, message) => {
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
      className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-dark-bg/50 to-transparent px-4 py-6 md:px-8"
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
          className="flex h-full items-center justify-center py-12"
        >
          <div className="text-center">
            <div className="mb-4 text-6xl">💬</div>
            <p className="text-lg font-semibold text-dark-text">No messages yet</p>
            <p className="mt-2 text-sm text-dark-muted">Say hello to start the conversation 👋</p>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {Object.entries(grouped).map(([day, dayMessages]) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            {/* Day Separator */}
            <div className="mb-6 flex items-center justify-center">
              <div className="glass-strong rounded-full px-4 py-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-dark-muted">
                  {day}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-1">
              {dayMessages.map((message, index) => {
                const isOwn = message.sender?.id === currentUserId;
                const sender = getSender(message);
                const showAvatar = !isOwn && index === 0 || 
                  (index > 0 && dayMessages[index - 1].sender?.id !== message.sender?.id);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    sender={showAvatar ? sender : null}
                  />
                );
              })}
            </div>
          </motion.div>
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
