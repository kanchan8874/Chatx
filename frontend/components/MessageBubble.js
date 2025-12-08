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
    <motion.article
      initial="initial"
      animate="animate"
      variants={bubbleVariants}
      className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} mb-4 px-2 sm:px-4`}
      role="article"
      aria-label={isOwn ? "Your message" : `Message from ${sender?.username || "User"}`}
    >
      <div className={`flex max-w-[75%] md:max-w-[60%] ${isOwn ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
        {/* Avatar - only show for received messages */}
        {!isOwn && sender && (
          <div className="flex-shrink-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-primary-500/30 ring-2 ring-primary-500/20">
              {sender.avatar ? (
                <Image
                  src={sender.avatar}
                  alt={`${sender.username || "User"}'s avatar`}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  aria-hidden="false"
                />
              ) : (
                <div 
                  className="flex h-full w-full items-center justify-center bg-gradient-primary text-xs font-semibold text-white"
                  aria-label={`${sender.username || "User"}'s avatar`}
                >
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
            {message.text && (
              <p className={`text-sm leading-relaxed sm:text-base ${isOwn ? "text-white" : "text-dark-text"}`}>
                {message.text}
              </p>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`mt-2 space-y-2 ${message.text ? "" : ""}`}>
                {message.attachments.map((attachment, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden">
                    {attachment.fileType === "image" ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 rounded-lg p-2 border ${
                          isOwn
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-white/5 border-white/10 text-dark-text"
                        } hover:bg-white/10 transition-colors`}
                      >
                        <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs truncate flex-1">{attachment.filename}</span>
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <div className={`mt-1.5 flex items-center justify-end gap-1 ${isOwn ? "text-white/80" : "text-dark-muted"}`}>
              <time 
                dateTime={message.createdAt}
                className="text-[10px] font-medium sm:text-xs"
                aria-label={`Sent at ${dayjs(message.createdAt).format("h:mm A")}`}
              >
                {dayjs(message.createdAt).format("HH:mm")}
              </time>
              {isOwn && (
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-label="Message delivered"
                  role="img"
                >
                  <title>Message delivered</title>
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
    </motion.article>
  );
}

