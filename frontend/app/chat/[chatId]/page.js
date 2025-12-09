import { notFound, redirect } from "next/navigation";
import ChatShell from "@/components/ChatShell";
import { getCurrentUser } from "@/lib/auth";
import { fetchChat, fetchChats, fetchMessages } from "@/lib/chat";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function ChatDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Next.js 16: params is now a Promise, must await it
  const { chatId } = await params;

  if (!chatId) {
    notFound();
  }

  const [chats, chat, messagesPayload] = await Promise.all([
    fetchChats(),
    fetchChat(chatId),
    fetchMessages(chatId, { limit: 60 }),
  ]);

  if (!chat) {
    notFound();
  }

  return (
    <main className="w-full">
      <ChatShell
        user={user}
        initialChats={chats}
        initialMessages={messagesPayload.messages}
        activeChatId={chatId}
      />
    </main>
  );
}

