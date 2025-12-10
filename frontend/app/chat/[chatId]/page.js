import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fetchChat, fetchChats, fetchMessages } from "@/lib/chat";
import ChatDetailPageClient from "./ChatDetailPageClient";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function ChatDetailPage({ params }) {
  // Try to get user, but don't redirect immediately if not found
  // Let client-side handle the auth check for smoother navigation
  const user = await getCurrentUser();
  
  // Next.js 16: params is now a Promise, must await it
  const { chatId } = await params;

  if (!chatId) {
    notFound();
  }

  let chats = [];
  let chat = null;
  let messages = [];

  // Only fetch data if user is available
  if (user) {
    try {
      const [chatsData, chatData, messagesPayload] = await Promise.all([
        fetchChats().catch(() => []),
        fetchChat(chatId).catch(() => null),
        fetchMessages(chatId, { limit: 60 }).catch(() => ({ messages: [] })),
      ]);
      
      chats = chatsData || [];
      chat = chatData || null;
      // Extract messages from payload
      messages = messagesPayload?.messages || [];
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  }

  // Pass to client component - it will handle auth check and redirect if needed
  return (
    <ChatDetailPageClient
      initialUser={user}
      initialChats={chats}
      initialMessages={messages}
      chatId={chatId}
      initialChat={chat}
    />
  );
}

