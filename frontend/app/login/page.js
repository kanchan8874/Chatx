import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginPageClient from "./LoginPageClient";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/chat");
  }

  return <LoginPageClient />;
}
