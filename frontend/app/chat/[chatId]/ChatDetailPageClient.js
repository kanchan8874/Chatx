"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatShell from "@/components/ChatShell";
import { getBrowserApiBase } from "@/lib/api-client";

export default function ChatDetailPageClient({ 
  initialUser, 
  initialChats, 
  initialMessages, 
  chatId,
  initialChat 
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [chats, setChats] = useState(initialChats || []);
  const [messages, setMessages] = useState(initialMessages || []);
  const [chat, setChat] = useState(initialChat);
  const [isLoading, setIsLoading] = useState(!initialUser);
  // If initialChat is explicitly null, server tried to fetch but it wasn't found
  // If initialChat is undefined, server didn't try (no user)
  const [hasCheckedChat, setHasCheckedChat] = useState(initialChat !== undefined);
  const hasCheckedAuthRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (hasCheckedAuthRef.current) {
      console.log("🔍 Auth check already in progress, skipping...");
      return;
    }

    try {
      hasCheckedAuthRef.current = true;
      setIsLoading(true);
      console.log("🔍 Client-side auth check starting...");
      const apiBase = getBrowserApiBase();
      const response = await fetch(`${apiBase}/api/auth/me`, {
        credentials: "include",
      });

      console.log("🔍 Auth check response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Auth check data:", data);
        if (data.user) {
          console.log("✅ User found:", data.user.email);
          setUser(data.user);
          setIsLoading(false);
          
          // Fetch chat data if we have user but not chat data
          if (!chat && chatId && !hasCheckedChat) {
            try {
              console.log(`🔍 Fetching chat data for chatId: ${chatId}`);
              const [chatResponse, messagesResponse, chatsResponse] = await Promise.all([
                fetch(`${apiBase}/api/chat/${chatId}`, {
                  credentials: "include",
                }),
                fetch(`${apiBase}/api/messages/${chatId}?limit=60`, {
                  credentials: "include",
                }),
                fetch(`${apiBase}/api/chat`, {
                  credentials: "include",
                }),
              ]);
              
              if (chatResponse.ok) {
                const chatData = await chatResponse.json();
                if (chatData.chat) {
                  console.log("✅ Chat found:", chatData.chat.id);
                  setChat(chatData.chat);
                  setHasCheckedChat(true);
                } else {
                  console.log("❌ Chat not found in response");
                  setHasCheckedChat(true);
                }
              } else if (chatResponse.status === 404) {
                console.log("❌ Chat not found (404)");
                setHasCheckedChat(true);
              } else {
                console.log("❌ Chat fetch failed with status:", chatResponse.status);
                setHasCheckedChat(true);
              }
              
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                setMessages(messagesData.messages || []);
              }
              
              if (chatsResponse.ok) {
                const chatsData = await chatsResponse.json();
                setChats(chatsData.chats || []);
              }
            } catch (error) {
              console.error("Error fetching chat data:", error);
              setHasCheckedChat(true);
            }
          }
        } else {
          console.log("❌ No user in response, redirecting to login");
          router.replace("/login");
        }
      } else {
        console.log("❌ Auth check failed with status:", response.status);
        router.replace("/login");
      }
    } catch (error) {
      console.error("❌ Auth check error:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router, chatId, chat, hasCheckedChat]);

  useEffect(() => {
    // If user is available from server, we're done
    if (initialUser) {
      console.log("✅ User available from server:", initialUser.email);
      setUser(initialUser);
      setIsLoading(false);
      
      // Ensure chats and messages are set from server data
      if (initialChats && initialChats.length > 0) {
        setChats(initialChats);
        console.log(`✅ Set ${initialChats.length} chats from server`);
      }
      
      if (initialMessages && initialMessages.length > 0) {
        setMessages(initialMessages);
        console.log(`✅ Set ${initialMessages.length} messages from server`);
      }
      
      // Server always tries to fetch chat if user exists
      // So initialChat is either the chat object or null (not found)
      if (initialChat !== undefined) {
        setHasCheckedChat(true);
        if (initialChat) {
          setChat(initialChat);
          console.log("✅ Chat found from server:", initialChat.id);
        } else {
          console.log("❌ Chat not found from server (null)");
        }
      }
      return;
    }

    // If user is not available from server, try to fetch client-side
    // Only check once to avoid infinite loops
    if (!initialUser && !hasCheckedAuthRef.current) {
      console.log("🔍 No user from server, checking client-side...");
      checkAuth();
    }
  }, [initialUser, checkAuth, initialChat, initialChats, initialMessages]);

  // Redirect to /chat if chat is not found after checking
  // But only if chat doesn't exist in chats list either
  useEffect(() => {
    if (user && hasCheckedChat && !chat && !hasRedirectedRef.current && chatId) {
      // Check if chat exists in chats list before redirecting
      const chatExistsInList = chats.some((c) => c.id === chatId || c.id?.toString() === chatId);
      if (!chatExistsInList) {
        console.log("❌ Chat not found in API or chats list, redirecting to /chat");
        hasRedirectedRef.current = true;
        router.replace("/chat");
      } else {
        console.log("✅ Chat found in chats list, using it even though API returned null");
        // Use the chat from the chats list
        const chatFromList = chats.find((c) => c.id === chatId || c.id?.toString() === chatId);
        if (chatFromList) {
          setChat(chatFromList);
        }
      }
    }
  }, [user, hasCheckedChat, chat, chatId, router, chats]);

  if (isLoading) {
    return (
      <main className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Show loading while checking chat, but redirect if not found
  if (!chat && !hasCheckedChat) {
    return (
      <main className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading chat...</p>
        </div>
      </main>
    );
  }

  // If chat is not found and we've checked, redirect (handled by useEffect above)
  if (!chat && hasCheckedChat) {
    return null; // Will redirect via useEffect
  }

  console.log("📤 Rendering ChatShell with:", {
    user: user?.email,
    chatsCount: chats.length,
    messagesCount: messages.length,
    chatId: chatId,
    chat: chat?.id
  });

  return (
    <main className="w-full">
      <ChatShell
        user={user}
        initialChats={chats}
        initialMessages={messages}
        activeChatId={chatId}
      />
    </main>
  );
}

