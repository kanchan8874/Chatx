"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

/**
 * Premium message input component
 * Floating input bar with emoji picker and send button
 */
export default function MessageInput({
  onSend,
  disabled,
  socket,
  activeChatId,
  currentUser,
}) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const emitTyping = (eventType) => {
    if (!socket || !activeChatId) return;
    socket.emit(`typing:${eventType}`, {
      chatId: activeChatId,
      user: currentUser?.username,
    });
  };

  const handleTyping = (event) => {
    const value = event.target.value;
    setMessage(value);
    
    if (!socket || !activeChatId) return;

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      emitTyping("start");
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(
      setTimeout(() => {
        setIsTyping(false);
        emitTyping("stop");
      }, 1200),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || disabled) return;

    try {
      await onSend?.(message.trim());
      setMessage("");
      setIsTyping(false);
      emitTyping("stop");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      toast.error(error.message || "Unable to send message.");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <motion.form
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onSubmit={handleSubmit}
      className="glass-panel border-t border-white/10 px-6 py-4"
    >
      <div className="flex items-end gap-3">
        {/* Emoji Button (Placeholder) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="glass-strong flex-shrink-0 rounded-xl p-2.5 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text"
          aria-label="Emoji picker"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.button>

        {/* Attachment Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="glass-strong flex-shrink-0 rounded-xl p-2.5 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text"
          aria-label="Attach file"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </motion.button>

        {/* Input Area */}
        <div className="glass-strong relative flex-1 rounded-2xl px-4 py-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="max-h-32 w-full resize-none bg-transparent text-sm text-dark-text placeholder-dark-muted outline-none"
          />
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={disabled || !message.trim()}
          whileHover={{ scale: disabled || !message.trim() ? 1 : 1.05 }}
          whileTap={{ scale: disabled || !message.trim() ? 1 : 0.95 }}
          className={`flex-shrink-0 rounded-xl px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-all ${
            disabled || !message.trim()
              ? "cursor-not-allowed bg-dark-surface opacity-50"
              : "bg-gradient-primary hover:shadow-glow-primary"
          }`}
        >
          <span className="flex items-center gap-2">
            Send
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </span>
        </motion.button>
      </div>
    </motion.form>
  );
}
