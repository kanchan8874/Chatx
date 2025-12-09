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
      className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} mb-3 sm:mb-4 px-1 sm:px-2 md:px-4`}
      role="article"
      aria-label={isOwn ? "Your message" : `Message from ${sender?.username || "User"}`}
    >
      <div className={`flex max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[60%] ${isOwn ? "flex-row-reverse" : "flex-row"} items-end gap-1.5 sm:gap-2`}>
        {/* Avatar - only show for received messages */}
        {!isOwn && sender && (
          <div className="flex-shrink-0 hidden sm:block">
            <div className="relative h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full border-2 border-primary-500/30 ring-2 ring-primary-500/20">
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
            <span className="mb-1 px-2 text-xs sm:text-sm font-medium text-dark-muted">
              {sender.username}
            </span>
          )}
          
          <div
            className={`group relative rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 ${
              isOwn
                ? "bg-gradient-primary text-white rounded-br-md"
                : "glass-strong text-dark-text rounded-bl-md border border-white/10"
            } ${
              message.attachments && message.attachments.length > 0 && !message.text
                ? "p-0" // No padding if only attachments
                : "px-3 py-2 sm:px-4 sm:py-2.5" // Responsive padding
            }`}
          >
            {/* Message Text */}
            {message.text && (
              <p className={`text-sm sm:text-base md:text-base leading-relaxed emoji-text ${
                isOwn ? "text-white" : "text-dark-text"
              } ${
                message.attachments && message.attachments.length > 0 ? "mb-2" : ""
              }`} style={{ fontSize: '16px', lineHeight: '1.6' }}>
                {message.text}
              </p>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`space-y-1.5 ${message.text ? "mt-2" : ""} ${
                !message.text ? "p-0.5" : ""
              }`}>
                {message.attachments.map((attachment, idx) => {
                  const isImage = attachment.fileType === "image" || 
                                 attachment.fileType?.startsWith("image/") ||
                                 attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                  
                  return (
                  <div key={idx} className="relative group/attachment">
                    {isImage ? (
                      // Image Attachment - Compact & Minimal
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative rounded-lg overflow-hidden bg-black/10"
                      >
                        <div className="relative max-w-[280px] sm:max-w-[320px] w-full" style={{ maxHeight: '250px' }}>
                          <img
                            src={attachment.url}
                            alt={attachment.filename || "Image"}
                            className="w-full h-auto rounded-lg object-contain cursor-pointer"
                            loading="lazy"
                            style={{ maxHeight: '250px' }}
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover/attachment:opacity-100 transition-opacity duration-200">
                              <div className={`rounded-full p-2 ${
                                isOwn ? "bg-white/20" : "bg-black/20"
                              }`}>
                                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Image caption/filename - minimal */}
                        {attachment.filename && attachment.filename !== attachment.url.split("/").pop() && (
                          <div className={`absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 via-black/40 to-transparent rounded-b-lg`}>
                            <p className={`text-[10px] truncate text-white`}>
                              {attachment.filename}
                            </p>
                          </div>
                        )}
                      </a>
                    ) : (
                      // File/Document Attachment - WhatsApp style
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={attachment.filename}
                        className={`flex items-center gap-3 rounded-xl p-3.5 border transition-all duration-200 ${
                          isOwn
                            ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
                            : "bg-white/5 border-white/10 text-dark-text hover:bg-white/10"
                        }`}
                      >
                        {/* File Icon */}
                        <div className={`flex-shrink-0 rounded-lg p-2.5 ${
                          isOwn 
                            ? "bg-white/20" 
                            : "bg-primary-500/20"
                        }`}>
                          {attachment.filename?.match(/\.(pdf)$/i) ? (
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                          ) : attachment.filename?.match(/\.(doc|docx)$/i) ? (
                            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                          ) : (
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        
                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm sm:text-base font-medium truncate ${
                            isOwn ? "text-white" : "text-dark-text"
                          }`} style={{ fontSize: '14px' }}>
                            {attachment.filename || "File"}
                          </p>
                          {attachment.fileSize && (
                            <p className={`text-xs sm:text-sm mt-0.5 ${
                              isOwn ? "text-white/70" : "text-dark-muted"
                            }`} style={{ fontSize: '12px' }}>
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                        
                        {/* Download Icon */}
                        <div className="flex-shrink-0">
                          <svg className={`h-5 w-5 ${
                            isOwn ? "text-white/80" : "text-primary-400"
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                      </a>
                    )}
                  </div>
                  );
                })}
              </div>
            )}

            {/* Timestamp */}
            <div className={`mt-1.5 flex items-center justify-end gap-1 ${isOwn ? "text-white/80" : "text-dark-muted"}`}>
              <time 
                dateTime={message.createdAt}
                className="text-xs font-medium sm:text-xs"
                aria-label={`Sent at ${dayjs(message.createdAt).format("h:mm A")}`}
                style={{ fontSize: '11px' }}
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

