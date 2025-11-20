"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import UserBadge from "./UserBadge";
import SearchBox from "./SearchBox";
import SidebarUserCard from "./SidebarUserCard";
import ThemeToggle from "./ThemeToggle";

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
}) {
  const [query, setQuery] = useState("");
  const [invite, setInvite] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredChats = useMemo(() => {
    if (!query) return chats;
    return chats.filter((chat) => {
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

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex h-full w-full max-w-sm flex-col border-r border-white/10 bg-dark-surface/80 backdrop-blur-2xl"
    >
      {/* User Profile Section */}
      <div className="glass-panel m-4 mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserBadge
              user={currentUser}
              isOnline={onlineUsers.includes(currentUser?.id)}
              size="md"
              showStatus={true}
            />
            <div>
              <p className="text-xs text-dark-muted">Logged in as</p>
              <p className="text-sm font-semibold text-dark-text">
                {currentUser?.username || "User"}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Search Box */}
      <div className="px-4">
        <SearchBox
          onSearch={setQuery}
          placeholder="Search chats..."
          className="mb-4"
        />
      </div>

      {/* New Chat Input */}
      <div className="px-4">
        <form onSubmit={handleCreateChat} className="mb-4">
          <div className="glass-strong flex items-center gap-2 rounded-2xl p-2">
            <input
              type="text"
              placeholder="Start new chat..."
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-dark-text placeholder-dark-muted outline-none"
            />
            <motion.button
              type="submit"
              disabled={isCreating || !invite.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-gradient-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-primary"
            >
              {isCreating ? "..." : "New"}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 text-center"
          >
            <p className="text-sm text-dark-muted">
              {query ? "No chats match your search." : "Start a chat to get going."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filteredChats.map((chat, index) => {
              const peer = getPeer(chat, currentUser?.id);
              const isOnline = onlineUsers.includes(peer?.id);

              return (
                <SidebarUserCard
                  key={chat.id}
                  chat={chat}
                  user={currentUser}
                  isActive={activeChatId === chat.id}
                  isOnline={isOnline}
                  onClick={() => onSelectChat?.(chat.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
