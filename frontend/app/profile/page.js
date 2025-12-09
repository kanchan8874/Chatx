import { redirect } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
import { getCurrentUser } from "@/lib/auth";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <ProfilePageClient initialUser={user} />;
}

