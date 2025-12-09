import { redirect } from "next/navigation";
import ChatShell from "@/components/ChatShell";
import { getCurrentUser } from "@/lib/auth";
import { fetchChats } from "@/lib/chat";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function ChatHomePage() {
  try {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

    const chats = await fetchChats();

  return (
    <main className="w-full">
      <ChatShell user={user} initialChats={chats} initialMessages={[]} />
    </main>
  );
  } catch (error) {
    console.error("Chat page error:", error);
    redirect("/login");
  }
}

