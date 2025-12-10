import ProfilePageClient from "./ProfilePageClient";
import { getCurrentUser } from "@/lib/auth";

// Force dynamic rendering because we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  // Try to get user, but don't redirect immediately if not found
  // Let client-side handle the auth check for smoother navigation
  const user = await getCurrentUser();

  // Pass to client component - it will handle auth check and redirect if needed
  return <ProfilePageClient initialUser={user} />;
}

