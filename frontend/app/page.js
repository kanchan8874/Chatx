import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/chat" : "/login");
}
