import { redirect } from "next/navigation";
import ChatShell from "@/components/ChatShell";
import { getCurrentUser } from "@/lib/auth";
import { fetchChats } from "@/lib/chat";

export default async function ChatHomePage() {
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
}

