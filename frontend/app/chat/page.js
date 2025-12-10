import { getCurrentUser } from "@/lib/auth";
import { fetchChats } from "@/lib/chat";
import ChatPageClient from "./ChatPageClient";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function ChatHomePage() {
  try {
    // Try to get user, but don't redirect immediately if not found
    // Let client-side handle the auth check for smoother navigation
    const user = await getCurrentUser();
    let chats = [];

    // Only fetch chats if user is available
    if (user) {
      try {
        chats = await fetchChats();
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    }

    // Pass user and chats to client component
    // Client component will handle auth check and redirect if needed
    return (
      <ChatPageClient 
        initialUser={user} 
        initialChats={chats} 
        initialMessages={[]} 
      />
    );
  } catch (error) {
    console.error("Chat page error:", error);
    // Don't redirect here - let client component handle it
    return (
      <ChatPageClient 
        initialUser={null} 
        initialChats={[]} 
        initialMessages={[]} 
      />
    );
  }
}

