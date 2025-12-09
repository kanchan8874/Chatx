"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import UserBadge from "./UserBadge";
import SearchBox from "./SearchBox";
import SidebarUserCard from "./SidebarUserCard";
import ThemeToggle from "./ThemeToggle";
import ProfileDropdown from "./ProfileDropdown";
import { logout } from "@/lib/profile";

function getPeer(chat, currentUserId) {
  return (
    chat.members?.find((member) => member.id !== currentUserId) ||
    chat.members?.[0] ||
    null
  );
}

/**
 * Premium sidebar component with glassmorphism
 * WhatsApp + Discord hybrid design
 */
export default function ChatSidebar({
  chats = [],
  activeChatId,
  onSelectChat,
  onCreateChat,
  currentUser,
  onlineUsers = [],
  onClose,
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [invite, setInvite] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const filteredChats = useMemo(() => {
    // First, remove duplicates based on chat.id
    const uniqueChats = chats.filter((chat, index, self) => {
      const chatId = chat.id?.toString();
      if (!chatId) return false;
      return index === self.findIndex((c) => c.id?.toString() === chatId);
    });
    
    // Then apply search filter if query exists
    if (!query) return uniqueChats;
    return uniqueChats.filter((chat) => {
      const peer = getPeer(chat, currentUser?.id);
      const haystack = `${peer?.username} ${peer?.email}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [chats, query, currentUser?.id]);

  const handleCreateChat = async (event) => {
    event.preventDefault();
    if (!invite.trim()) {
      toast.error("Enter a username or email to start chatting.");
      return;
    }

    try {
      setIsCreating(true);
      await onCreateChat?.(invite.trim());
      setInvite("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to logout");
      // Still redirect to login
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex h-full w-full max-w-sm flex-col border-r border-white/10 bg-dark-surface/80 backdrop-blur-2xl lg:max-w-sm overflow-hidden"
      aria-label="Chat list sidebar"
    >
      {/* User Profile Section */}
      <header className="glass-panel m-3 mb-4 p-3 sm:m-4 sm:mb-6 sm:p-4" role="banner">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <ProfileDropdown
              user={currentUser}
              isOnline={onlineUsers.includes(currentUser?.id)}
          />
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="glass-strong rounded-xl p-2 text-dark-muted transition-colors hover:bg-white/10 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg lg:hidden"
                aria-label="Close sidebar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Search Box */}
      <div className="px-3 sm:px-4">
        <SearchBox
          onSearch={setQuery}
          placeholder="Search chats..."
          className="mb-3 sm:mb-4"
        />
      </div>

      {/* New Chat Input */}
      <div className="px-3 sm:px-4">
        <form onSubmit={handleCreateChat} className="mb-3 sm:mb-4">
          <div className="glass-strong flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl p-1.5 sm:p-2">
            <input
              type="text"
              placeholder="Start new chat..."
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              className="flex-1 bg-transparent px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base text-dark-text placeholder-dark-muted outline-none"
              style={{ fontSize: '15px' }}
            />
            <motion.button
              type="submit"
              disabled={isCreating || !invite.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg sm:rounded-xl bg-gradient-primary px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-semibold uppercase tracking-wider text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-primary touch-manipulation"
              style={{ fontSize: '14px' }}
            >
              {isCreating ? "..." : "New"}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Chat List */}
      <nav className="flex-1 overflow-y-auto px-3 sm:px-4 scrollbar-hide min-h-0" aria-label="Chat list">
        {filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 text-center"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-dark-muted sm:text-base" style={{ fontSize: '14px' }}>
              {query ? "No chats match your search." : "Start a chat to get going."}
            </p>
          </motion.div>
        ) : (
          <ul className="space-y-2" role="list">
            {filteredChats.map((chat, index) => {
              const peer = getPeer(chat, currentUser?.id);
              const isOnline = onlineUsers.includes(peer?.id);

              return (
                <li key={chat.id}>
                <SidebarUserCard
                  chat={chat}
                  user={currentUser}
                  isActive={activeChatId === chat.id}
                  isOnline={isOnline}
                  onClick={() => onSelectChat?.(chat.id)}
                />
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Logout Button - Compact & Attractive */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0 px-3 pb-3 sm:px-4 sm:pb-4 pt-2 border-t border-white/10"
      >
        <motion.button
          onClick={handleLogout}
          disabled={isLoggingOut}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="w-full glass-strong rounded-lg px-3 py-1.5 sm:px-3 sm:py-2 border border-red-500/25 hover:border-red-500/50 transition-all group relative overflow-hidden backdrop-blur-xl hover:bg-red-500/5"
          aria-label="Logout"
        >
          {/* Subtle Gradient Background on Hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/8 via-orange-500/8 to-red-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
          <div className="relative flex items-center justify-center gap-2">
            {/* Compact Icon */}
            <div className="flex-shrink-0 rounded-md bg-red-500/20 p-1.5 group-hover:bg-red-500/30 transition-colors">
              <svg 
                className="h-5 w-5 text-red-400 group-hover:text-red-300 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </div>
            
            {/* Compact Text */}
            <span className="text-sm sm:text-base font-semibold text-red-500 group-hover:text-red-300 transition-colors whitespace-nowrap" style={{ fontSize: '14px' }}>
              {isLoggingOut ? "Logging out..." : "Logout"}
            </span>
          </div>
          
          {/* Minimal Loading Spinner */}
          {isLoggingOut && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-dark-surface/80 backdrop-blur-sm rounded-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-3.5 w-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full"
              />
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    </motion.aside>
  );
}
