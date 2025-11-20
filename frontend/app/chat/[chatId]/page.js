import { notFound, redirect } from "next/navigation";
import ChatShell from "@/components/ChatShell";
import { getCurrentUser } from "@/lib/auth";
import { fetchChat, fetchChats, fetchMessages } from "@/lib/chat";

export default async function ChatDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [chats, chat, messagesPayload] = await Promise.all([
    fetchChats(),
    fetchChat(params.chatId),
    fetchMessages(params.chatId, { limit: 60 }),
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
        activeChatId={params.chatId}
      />
    </main>
  );
}

