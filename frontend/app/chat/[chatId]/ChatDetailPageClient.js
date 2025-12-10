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
  const hasCheckedAuthRef = useRef(false);

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
          if (!chat && chatId) {
            try {
              const [chatResponse, messagesResponse] = await Promise.all([
                fetch(`${apiBase}/api/chat/${chatId}`, {
                  credentials: "include",
                }),
                fetch(`${apiBase}/api/messages/${chatId}?limit=60`, {
                  credentials: "include",
                }),
              ]);
              
              if (chatResponse.ok) {
                const chatData = await chatResponse.json();
                setChat(chatData.chat);
              }
              
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                setMessages(messagesData.messages || []);
              }
            } catch (error) {
              console.error("Error fetching chat data:", error);
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
  }, [router, chatId, chat]);

  useEffect(() => {
    // If user is available from server, we're done
    if (initialUser) {
      console.log("✅ User available from server:", initialUser.email);
      setUser(initialUser);
      setIsLoading(false);
      return;
    }

    // If user is not available from server, try to fetch client-side
    // Only check once to avoid infinite loops
    if (!initialUser && !hasCheckedAuthRef.current) {
      console.log("🔍 No user from server, checking client-side...");
      checkAuth();
    }
  }, [initialUser, checkAuth]);

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

  if (!chat) {
    return (
      <main className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <p className="text-gray-300">Chat not found</p>
        </div>
      </main>
    );
  }

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

