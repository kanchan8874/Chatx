"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatShell from "@/components/ChatShell";
import { getBrowserApiBase } from "@/lib/api-client";

export default function ChatPageClient({ initialUser, initialChats, initialMessages }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [chats, setChats] = useState(initialChats || []);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    // If user is not available from server, try to fetch client-side
    if (!user && !isLoading) {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const apiBase = getBrowserApiBase();
      const response = await fetch(`${apiBase}/api/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          // Fetch chats if we have user
          const chatsResponse = await fetch(`${apiBase}/api/chat`, {
            credentials: "include",
          });
          if (chatsResponse.ok) {
            const chatsData = await chatsResponse.json();
            setChats(chatsData.chats || []);
          }
        } else {
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <main className="w-full">
      <ChatShell user={user} initialChats={chats} initialMessages={initialMessages || []} />
    </main>
  );
}

