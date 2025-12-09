"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { socket } = useSocket(user);
  const apiBase = useMemo(() => getBrowserApiBase(), []);
  
  // Use ref to always get the latest activeChatId in socket handlers
  const activeChatIdRef = useRef(activeChatId);
  
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

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
    if (!socket || !activeChatId) {
      console.log("⚠️ Cannot join chat room:", { socket: !!socket, activeChatId });
      return;
    }
    const chatIdStr = activeChatId.toString();
    console.log(`🔌 Joining chat room: ${chatIdStr}`);
    
    // Update ref immediately when activeChatId changes
    activeChatIdRef.current = activeChatId;
    
    // Emit join event
    socket.emit("chat:join", chatIdStr);
    console.log(`    Emitted 'chat:join' for room: ${chatIdStr}`);
    
    return () => {
      console.log(` Leaving chat room: ${chatIdStr}`);
      socket.emit("chat:leave", chatIdStr);
    };
  }, [socket, activeChatId]);

  useEffect(() => {
    if (!socket) {
      console.log("⚠️ Socket not available, cannot set up event listeners");
      return;
    }

    // Check if socket is connected
    if (!socket.connected) {
      console.log("⚠️ Socket not connected yet, waiting for connection...");
      const handleConnect = () => {
        console.log("✅ Socket connected, setting up event listeners");
      };
      socket.once("connect", handleConnect);
      return () => {
        socket.off("connect", handleConnect);
      };
    }

    console.log("✅ Setting up socket event listeners");
    console.log("   Socket ID:", socket.id);
    console.log("   Socket connected:", socket.connected);

    const handleOnline = (ids) => {
      console.log("👥 Online users updated:", ids);
      setOnlineUsers(ids);
    };
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
      // Get the latest activeChatId from ref to avoid stale closure
      const currentActiveChatId = activeChatIdRef.current;
      
      console.log("📨 ========== MESSAGE RECEIVED VIA SOCKET ==========");
      console.log("   Message received at:", new Date().toISOString());
      console.log("   Active chat ID (from ref):", currentActiveChatId);
      console.log("   Active chat ID (from state):", activeChatId);
      console.log("   Message chat ID:", message.chatId);
      console.log("   Message chat (alternative):", message.chat);
      console.log("   Message text:", message.text?.substring(0, 50));
      console.log("   Message ID:", message.id);
      console.log("   Message _id:", message._id);
      
      // Normalize chatId for comparison (handle both string and ObjectId formats)
      const messageChatId = (message.chatId || message.chat)?.toString();
      const currentActiveChatIdStr = currentActiveChatId?.toString();
      
      console.log("   Normalized messageChatId:", messageChatId);
      console.log("   Normalized currentActiveChatId:", currentActiveChatIdStr);
      console.log("   Comparison (strict):", messageChatId === currentActiveChatIdStr);
      console.log("   Comparison (loose):", messageChatId == currentActiveChatIdStr);
      console.log("   Type check - messageChatId:", typeof messageChatId, messageChatId);
      console.log("   Type check - currentActiveChatIdStr:", typeof currentActiveChatIdStr, currentActiveChatIdStr);
      
      if (!messageChatId) {
        console.error("❌ Message has no chatId! Cannot process message.");
        console.error("   Message object:", message);
        return;
      }
      
      if (!currentActiveChatIdStr) {
        console.error("❌ No active chat ID! Cannot process message.");
        return;
      }
      
      // Update chats list (sidebar) - this should always happen
      setChats((prev) => {
        // First, remove any duplicates
        const uniqueChats = prev.filter((chat, index, self) => {
          const chatId = chat.id?.toString();
          if (!chatId) return false;
          return index === self.findIndex((c) => c.id?.toString() === chatId);
        });
        
        const updated = uniqueChats.map((chat) => {
          const chatIdStr = chat.id?.toString();
          if (chatIdStr === messageChatId) {
            console.log(`   ✅ Updating sidebar for chat: ${chatIdStr}`);
            const isActiveChat = chatIdStr === currentActiveChatIdStr;
            return {
              ...chat,
              lastMessage: {
                ...message,
              },
              // If this is the active chat, unreadCount should always be 0
              // Otherwise, increment the unread count
              unreadCount: isActiveChat ? 0 : ((chat.unreadCount || 0) + 1),
            };
          }
          return chat;
        });
        return [...updated].sort(
          (a, b) =>
            new Date(b.lastMessage?.createdAt || b.updatedAt) -
            new Date(a.lastMessage?.createdAt || a.updatedAt),
        );
      });

      // Add message to active chat if it matches - use functional update to get latest state
      // Use both strict and loose comparison to handle edge cases
      const isMatch = messageChatId === currentActiveChatIdStr || messageChatId == currentActiveChatIdStr;
      
      if (isMatch) {
        console.log("✅✅✅ MATCH! Message is for active chat, adding to messages list");
        
        // If chat is active, mark messages as read immediately and reset unreadCount
        if (currentActiveChatIdStr) {
          console.log("   📖 Chat is active, marking messages as read");
          fetch(`${apiBase}/api/messages/${currentActiveChatIdStr}/read`, {
            method: "PATCH",
            credentials: "include",
          }).catch((err) => {
            console.error("   ⚠️ Failed to mark messages as read:", err);
          });
          
          // Immediately reset unreadCount for active chat in sidebar
          setChats((prev) => {
            return prev.map((chat) => {
              const chatIdStr = chat.id?.toString();
              if (chatIdStr === currentActiveChatIdStr) {
                console.log(`   ✅ Resetting unreadCount to 0 for active chat in sidebar`);
                return { ...chat, unreadCount: 0 };
              }
              return chat;
            });
          });
        }
        
        setMessages((prev) => {
          console.log(`   Current messages count: ${prev.length}`);
          // Check if message already exists to prevent duplicates
          const exists = prev.some((m) => {
            const mId = m.id?.toString();
            const m_id = m._id?.toString();
            const msgId = message.id?.toString();
            const msg_id = message._id?.toString();
            
            // Only check for duplicates if IDs actually exist (not undefined/null)
            // Check both id and _id fields, but only if they're defined
            const idMatch = mId && msgId && mId === msgId;
            const underscoreIdMatch = m_id && msg_id && m_id === msg_id;
            
            const isDuplicate = idMatch || underscoreIdMatch;
            
            if (isDuplicate) {
              console.log(`   ⚠️ Duplicate found:`, {
                existingId: mId,
                newId: msgId,
                existing_id: m_id,
                new_id: msg_id,
                idMatch,
                underscoreIdMatch,
              });
            }
            return isDuplicate;
          });
          if (exists) {
            console.log("   ⚠️ Message already exists in state, skipping");
            return prev;
          }
          console.log("   ✅✅✅ Adding new message to messages state");
          const newMessages = [...prev, message];
          console.log(`   New messages count: ${newMessages.length}`);
          console.log(`   New message added:`, {
            id: message.id,
            text: message.text?.substring(0, 30),
            chatId: message.chatId,
          });
          return newMessages;
        });
      } else {
        console.log(`   ⚠️⚠️⚠️ NO MATCH! Message is for different chat`);
        console.log(`   Expected: "${currentActiveChatIdStr}" (type: ${typeof currentActiveChatIdStr})`);
        console.log(`   Received: "${messageChatId}" (type: ${typeof messageChatId})`);
        console.log(`   This message will NOT appear in active chat`);
        console.log(`   Sidebar will be updated but active chat will not`);
      }
      console.log("📨 ================================================");
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

    // Set up event listeners
    console.log("   Registering 'user:online' listener");
    socket.on("user:online", handleOnline);
    
    console.log("   Registering 'typing:start' listener");
    socket.on("typing:start", handleTypingStart);
    
    console.log("   Registering 'typing:stop' listener");
    socket.on("typing:stop", handleTypingStop);
    
    console.log("   Registering 'chat:message' listener");
    socket.on("chat:message", handleMessage);
    
    console.log("   Registering 'chat:refresh' listener");
    socket.on("chat:refresh", handleChatRefresh);
    
    // Test: Emit a test event to verify socket is working
    console.log("   ✅ All socket event listeners registered");
    console.log("   📡 Listening for: user:online, typing:start, typing:stop, chat:message, chat:refresh");

    return () => {
      console.log("🧹 Cleaning up socket event listeners");
      socket.off("user:online", handleOnline);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("chat:message", handleMessage);
      socket.off("chat:refresh", handleChatRefresh);
    };
  }, [socket, router]); // Removed activeChatId from deps, using ref instead

  useEffect(() => {
    if (!activeChatId) return;
    
    // Mark messages as read when chat becomes active
    console.log(`📖 Marking messages as read for chat: ${activeChatId}`);
    fetch(`${apiBase}/api/messages/${activeChatId}/read`, {
      method: "PATCH",
      credentials: "include",
    })
      .then(() => {
        console.log(`   ✅ Messages marked as read for chat: ${activeChatId}`);
      })
      .catch((err) => {
        console.error(`   ⚠️ Failed to mark messages as read:`, err);
      });
    
    // Reset unread count for active chat
    setChats((prev) => {
      const updated = prev.map((chat) => {
        const chatIdStr = chat.id?.toString();
        const activeChatIdStr = activeChatId?.toString();
        if (chatIdStr === activeChatIdStr) {
          console.log(`   ✅ Resetting unreadCount to 0 for active chat: ${chatIdStr}`);
          return { ...chat, unreadCount: 0 };
        }
        return chat;
      });
      return updated;
    });
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
        const loadedMessages = data.messages || [];
        // Remove duplicates based on ID
        const uniqueMessages = loadedMessages.filter((message, index, self) => 
          index === self.findIndex((m) => (m.id === message.id) || (m._id === message._id))
        );
        setMessages(uniqueMessages);
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
    // Close sidebar on mobile after selecting chat
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (text, attachments = []) => {
    const payload = {
      chatId: activeChatId,
      text,
      attachments: attachments || [],
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
    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.error("❌ Chat route not found. Is backend server running?");
          toast.error("Backend server not responding. Please check if server is running.");
          return;
        }
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        toast.error(error.error || "Unable to start chat.");
        return;
      }

      const data = await response.json();
      setChats((prev) => {
        // First remove any duplicates
        const uniqueChats = prev.filter((chat, index, self) => {
          const chatId = chat.id?.toString();
          if (!chatId) return false;
          return index === self.findIndex((c) => c.id?.toString() === chatId);
        });
        
        // Check if chat already exists to prevent duplicates
        const exists = uniqueChats.some((chat) => chat.id?.toString() === data.chat.id?.toString());
        if (exists) {
          console.log("⚠️ Chat already exists, not adding duplicate");
          return uniqueChats;
        }
        return [data.chat, ...uniqueChats];
      });
      handleSelectChat(data.chat.id);
    } catch (error) {
      console.error("❌ Error creating chat:", error);
      toast.error("Network error. Please check your connection.");
    }
  };

  return (
    <section 
      className="glass-panel relative flex h-[100dvh] flex-col overflow-hidden sm:h-[calc(100vh-4rem)] sm:flex-row"
      aria-label="Chat interface"
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onCreateChat={handleCreateChat}
          currentUser={user}
          onlineUsers={onlineUsers}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col bg-sidebar/30 min-h-0 overflow-hidden" role="main">
        <ChatHeader
          chat={activeChat ? { ...activeChat, currentUserId: user?.id } : null}
          onlineUsers={onlineUsers}
          onBack={() => router.push("/chat")}
          onMenuClick={() => setIsSidebarOpen(true)}
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
            className="flex flex-1 items-center justify-center text-center px-4"
          >
            <div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-4 text-4xl sm:text-5xl md:text-6xl"
              >
                💬
              </motion.div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.4em] text-primary-400">
                ChatX
              </p>
              <h2 className="mt-3 sm:mt-4 text-lg font-bold text-dark-text sm:text-xl md:text-2xl lg:text-3xl">
                Choose a chat or start a new conversation
              </h2>
              <p className="mt-2 text-xs text-dark-muted sm:text-sm md:text-base">
                Chats, typing indicators, and delivery receipts update in real time.
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </section>
  );
}

