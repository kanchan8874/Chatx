import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterPageClient from "./RegisterPageClient";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/chat");
  }

  return <RegisterPageClient />;
}
