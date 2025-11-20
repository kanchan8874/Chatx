"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Premium message bubble component with glassmorphism
 * Supports both sent and received messages with gradient styling
 */
export default function MessageBubble({ message, isOwn = false, sender = null }) {
  const bubbleVariants = {
    initial: { opacity: 0, scale: 0.8, y: 10 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      }
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={bubbleVariants}
      className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} mb-4 px-4`}
    >
      <div className={`flex max-w-[75%] md:max-w-[60%] ${isOwn ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
        {/* Avatar - only show for received messages */}
        {!isOwn && sender && (
          <div className="flex-shrink-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-primary-500/30 ring-2 ring-primary-500/20">
              {sender.avatar ? (
                <Image
                  src={sender.avatar}
                  alt={sender.username || "User"}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-xs font-semibold text-white">
                  {(sender.username || "U")[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {!isOwn && sender && (
            <span className="mb-1 px-2 text-xs font-medium text-dark-muted">
              {sender.username}
            </span>
          )}
          
          <div
            className={`group relative rounded-2xl px-4 py-2.5 shadow-lg transition-all duration-200 ${
              isOwn
                ? "bg-gradient-primary text-white rounded-br-md"
                : "glass-strong text-dark-text rounded-bl-md border border-white/10"
            }`}
          >
            {/* Message Text */}
            <p className={`text-sm leading-relaxed ${isOwn ? "text-white" : "text-dark-text"}`}>
              {message.text}
            </p>

            {/* Timestamp */}
            <div className={`mt-1.5 flex items-center justify-end gap-1 ${isOwn ? "text-white/70" : "text-dark-muted"}`}>
              <span className="text-[10px] font-medium">
                {dayjs(message.createdAt).format("HH:mm")}
              </span>
              {isOwn && (
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {/* Glow effect on hover */}
            {isOwn && (
              <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-primary opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

