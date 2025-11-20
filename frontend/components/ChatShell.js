"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ChatSidebar from "@/components/ChatSidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";
import { useSocket } from "@/hooks/useSocket";
import { getBrowserApiBase } from "@/lib/api-client";

export default function ChatShell({
  user,
  initialChats = [],
  initialMessages = [],
  activeChatId: serverActiveChatId = null,
}) {
  const router = useRouter();
  const [chats, setChats] = useState(initialChats);
  const [messages, setMessages] = useState(initialMessages);
  const [activeChatId, setActiveChatId] = useState(
    serverActiveChatId || initialChats[0]?.id || null,
  );
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingMap, setTypingMap] = useState({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const { socket } = useSocket(user);
  const apiBase = useMemo(() => getBrowserApiBase(), []);

  useEffect(() => {
    setActiveChatId(serverActiveChatId || null);
  }, [serverActiveChatId]);

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!serverActiveChatId && initialChats.length && !activeChatId) {
      setActiveChatId(initialChats[0].id);
    }
  }, [initialChats, serverActiveChatId, activeChatId]);

  useEffect(() => {
    if (!socket || !activeChatId) return;
    socket.emit("chat:join", activeChatId);
    return () => socket.emit("chat:leave", activeChatId);
  }, [socket, activeChatId]);

  useEffect(() => {
    if (!socket) return;

    const handleOnline = (ids) => setOnlineUsers(ids);
    const handleTypingStart = ({ chatId, user: username }) => {
      setTypingMap((prev) => {
        const current = new Set(prev[chatId] || []);
        current.add(username);
        return { ...prev, [chatId]: Array.from(current) };
      });
    };
    const handleTypingStop = ({ chatId, user: username }) => {
      setTypingMap((prev) => {
        const current = new Set(prev[chatId] || []);
        current.delete(username);
        return { ...prev, [chatId]: Array.from(current) };
      });
    };
    const handleMessage = (message) => {
      setChats((prev) => {
        const updated = prev.map((chat) =>
          chat.id === message.chatId
            ? {
                ...chat,
                lastMessage: {
                  ...message,
                },
                unreadCount:
                  chat.id === activeChatId ? 0 : (chat.unreadCount || 0) + 1,
              }
            : chat,
        );
        return [...updated].sort(
          (a, b) =>
            new Date(b.lastMessage?.createdAt || b.updatedAt) -
            new Date(a.lastMessage?.createdAt || a.updatedAt),
        );
      });

      if (message.chatId === activeChatId) {
        setMessages((prev) => [...prev, message]);
      }
    };
    const handleChatRefresh = ({ chatId, message }) => {
      setChats((prev) => {
        const exists = prev.some((chat) => chat.id === chatId);
        if (!exists) {
          router.refresh();
          return prev;
        }

        return prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                lastMessage: message || chat.lastMessage,
              }
            : chat,
        );
      });
    };

    socket.on("user:online", handleOnline);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("chat:message", handleMessage);
    socket.on("chat:refresh", handleChatRefresh);

    return () => {
      socket.off("user:online", handleOnline);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("chat:message", handleMessage);
      socket.off("chat:refresh", handleChatRefresh);
    };
  }, [socket, activeChatId, router]);

  useEffect(() => {
    if (!activeChatId) return;
    fetch(`${apiBase}/api/messages/${activeChatId}/read`, {
      method: "PATCH",
      credentials: "include",
    }).catch(() => {});
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId ? { ...chat, unreadCount: 0 } : chat,
      ),
    );
  }, [activeChatId, apiBase]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId],
  );

  const loadMessages = useCallback(
    async (chatId) => {
      if (!chatId) return;
      setIsLoadingMessages(true);
      try {
        const response = await fetch(`${apiBase}/api/messages/${chatId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Unable to load messages.");
        }
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [apiBase],
  );

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    router.push(`/chat/${chatId}`);
    loadMessages(chatId);
  };

  const handleSendMessage = async (text) => {
    const payload = {
      chatId: activeChatId,
      text,
    };

    const response = await fetch(`${apiBase}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send message.");
    }

    const data = await response.json();
    setMessages((prev) => [...prev, data.message]);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, lastMessage: data.message, unreadCount: 0 }
          : chat,
      ),
    );
  };

  const handleCreateChat = async (identifier) => {
    const response = await fetch(`${apiBase}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: identifier.trim() }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      toast.error(error.error || "Unable to start chat.");
      return;
    }

    const data = await response.json();
    setChats((prev) => [data.chat, ...prev]);
    handleSelectChat(data.chat.id);
  };

  return (
    <section className="glass-panel flex h-[calc(100vh-4rem)] overflow-hidden">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onCreateChat={handleCreateChat}
        currentUser={user}
        onlineUsers={onlineUsers}
      />
      <div className="flex flex-1 flex-col bg-sidebar/30">
        <ChatHeader
          chat={activeChat ? { ...activeChat, currentUserId: user?.id } : null}
          onlineUsers={onlineUsers}
          onBack={() => router.push("/chat")}
        />
        {activeChat ? (
          <>
            <MessageList
              messages={messages}
              currentUserId={user?.id}
              typingUsers={typingMap[activeChatId] || []}
              isLoading={isLoadingMessages}
              chatMembers={activeChat?.members || []}
            />
            <MessageInput
              onSend={handleSendMessage}
              socket={socket}
              activeChatId={activeChatId}
              currentUser={user}
              disabled={!activeChatId}
            />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-1 items-center justify-center text-center"
          >
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-6 text-6xl"
              >
                💬
              </motion.div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary-400">
                ChatX
              </p>
              <h2 className="mt-4 text-3xl font-bold text-dark-text">
                Choose a chat or start a new conversation
              </h2>
              <p className="mt-2 text-sm text-dark-muted">
                Chats, typing indicators, and delivery receipts update in real time.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

