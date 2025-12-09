"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleEmojiClick = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = message.substring(0, start);
    const textAfter = message.substring(end);
    const newMessage = textBefore + emoji + textAfter;

    setMessage(newMessage);
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Use environment variable for API URL, fallback to localhost for development
      const apiBase = 
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_BASE_URL ||
        (typeof window !== "undefined" 
          ? window.location.origin.replace(":3000", ":4000")
          : "http://localhost:4000");

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: percentComplete,
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid response from server"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || "Upload failed"));
            } catch (e) {
              reject(new Error("Upload failed"));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        xhr.open("POST", `${apiBase}/api/upload`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((!message.trim() && selectedFiles.length === 0) || disabled) return;

    try {
      // Upload files first
      const fileUrls = [];
      if (selectedFiles.length > 0) {
        toast.loading("Uploading files...", { id: "upload" });
        try {
          const uploadPromises = selectedFiles.map((file) => uploadFile(file));
          fileUrls.push(...(await Promise.all(uploadPromises)));
          toast.success("Files uploaded successfully!", { id: "upload" });
        } catch (error) {
          toast.error("Failed to upload files.", { id: "upload" });
          return;
        }
      }

      // Send message with text and attachments
      const messageText = message.trim();
      
      // fileUrls contains full attachment objects from uploadFile response
      const attachments = fileUrls;

      await onSend?.(messageText, attachments);
      setMessage("");
      setSelectedFiles([]);
      setUploadProgress({});
      setIsTyping(false);
      emitTyping("stop");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      toast.error(error.message || "Unable to send message.");
    }
  };

  return (
    <motion.form
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onSubmit={handleSubmit}
      className="glass-panel border-t border-white/10 px-2 py-3 sm:px-3 sm:py-3 md:px-4 md:py-4"
      aria-label="Message input form"
    >
      <div className="flex items-end gap-1.5 sm:gap-2 md:gap-3">
        {/* Emoji Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`glass-strong flex-shrink-0 rounded-lg sm:rounded-xl p-2 sm:p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg touch-manipulation ${
            showEmojiPicker
              ? "bg-primary-500/20 text-primary-400"
              : "text-dark-muted hover:bg-white/10 hover:text-dark-text"
          }`}
          aria-label="Open emoji picker"
          title="Add emoji"
          aria-pressed={showEmojiPicker}
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          onClick={() => fileInputRef.current?.click()}
          className={`glass-strong flex-shrink-0 rounded-lg sm:rounded-xl p-2 sm:p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg touch-manipulation ${
            selectedFiles.length > 0
              ? "bg-primary-500/20 text-primary-400"
              : "text-dark-muted hover:bg-white/10 hover:text-dark-text"
          }`}
          aria-label="Attach file"
          title="Attach file"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </motion.button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
          aria-label="File input"
        />

        {/* Input Area */}
        <div className="glass-strong relative flex-1 rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3">
          <label htmlFor="message-input" className="sr-only">
            Type your message
          </label>
          <textarea
            id="message-input"
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="max-h-32 w-full resize-none bg-transparent text-base sm:text-base md:text-base text-dark-text placeholder-dark-muted outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-transparent"
            style={{ fontSize: '16px', lineHeight: '1.5' }}
            aria-label="Message input"
            aria-describedby="message-hint"
          />
          <span id="message-hint" className="sr-only">
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
          whileHover={{ scale: disabled || (!message.trim() && selectedFiles.length === 0) ? 1 : 1.05 }}
          whileTap={{ scale: disabled || (!message.trim() && selectedFiles.length === 0) ? 1 : 0.95 }}
          className={`flex-shrink-0 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg touch-manipulation md:px-6 ${
            disabled || (!message.trim() && selectedFiles.length === 0)
              ? "cursor-not-allowed bg-dark-surface opacity-50"
              : "bg-gradient-primary hover:shadow-glow-primary"
          }`}
          aria-label="Send message"
          aria-disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
        >
          <span className="flex items-center gap-1 sm:gap-2">
            <span className="sr-only sm:inline">Send</span>
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {selectedFiles.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-strong flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs"
            >
              <span className="truncate max-w-[80px] text-dark-text sm:max-w-[120px] md:max-w-[200px]">
                {file.name}
              </span>
              {uploadProgress[file.name] && uploadProgress[file.name] < 100 && (
                <span className="text-primary-400">
                  {Math.round(uploadProgress[file.name])}%
                </span>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="rounded-full p-1 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text"
                aria-label={`Remove ${file.name}`}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiClick={handleEmojiClick}
      />
    </motion.form>
  );
}
