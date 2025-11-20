import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterPageClient from "./RegisterPageClient";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/chat");
  }

  return <RegisterPageClient />;
}
