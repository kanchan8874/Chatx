"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ChatShell from "@/components/ChatShell";
import { getBrowserApiBase } from "@/lib/api-client";

export default function ChatPageClient({ initialUser, initialChats, initialMessages }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [chats, setChats] = useState(initialChats || []);
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
      console.log("   API Base URL:", apiBase || "relative (using proxy)");
      console.log("   Request URL:", `${apiBase}/api/auth/me`);
      console.log("   Current origin:", typeof window !== "undefined" ? window.location.origin : "server");
      
      const response = await fetch(`${apiBase}/api/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("🔍 Auth check response status:", response.status);
      console.log("   Response headers:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Auth check data:", data);
        if (data.user) {
          console.log("✅ User found:", data.user.email);
          setUser(data.user);
          setIsLoading(false);
          
          // Fetch chats if we have user
          try {
            console.log("📥 Fetching chats for user...");
            const chatsResponse = await fetch(`${apiBase}/api/chat`, {
              credentials: "include",
            });
            if (chatsResponse.ok) {
              const chatsData = await chatsResponse.json();
              const fetchedChats = chatsData.chats || [];
              console.log(`✅ Fetched ${fetchedChats.length} chats`);
              setChats(fetchedChats);
            } else {
              console.error("❌ Failed to fetch chats:", chatsResponse.status);
            }
          } catch (chatsError) {
            console.error("❌ Error fetching chats:", chatsError);
          }
        } else {
          console.log("❌ No user in response, redirecting to login");
          router.replace("/login");
        }
      } else {
        console.log("❌ Auth check failed with status:", response.status);
        if (response.status === 401) {
          console.log("   ℹ️ Not authenticated. Please log in first.");
          console.log("   💡 If you just logged in, cookies may be blocked by browser.");
          console.log("   💡 Try enabling third-party cookies or use a local backend for development.");
        }
        router.replace("/login");
      }
    } catch (error) {
      console.error("❌ Auth check error:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // If user is available from server, we're done
    if (initialUser) {
      console.log("✅ User available from server:", initialUser.email);
      setUser(initialUser);
      setIsLoading(false);
      
      // Ensure chats are set from server
      if (initialChats && initialChats.length > 0) {
        console.log(`✅ Setting ${initialChats.length} chats from server`);
        setChats(initialChats);
      } else if (initialChats && initialChats.length === 0) {
        console.log("ℹ️ No chats from server (empty array)");
        setChats([]);
      }
      return;
    }

    // If user is not available from server, try to fetch client-side
    // Only check once to avoid infinite loops
    if (!initialUser && !hasCheckedAuthRef.current) {
      console.log("🔍 No user from server, checking client-side...");
      checkAuth();
    }
  }, [initialUser, checkAuth, initialChats]);

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

