import { redirect } from "next/navigation";
import ProfilePageClient from "./ProfilePageClient";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <ProfilePageClient initialUser={user} />;
}

