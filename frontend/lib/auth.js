import { serverFetch } from "./api-client-server";

export async function getCurrentUser() {
  try {
    const data = await serverFetch("/api/auth/me");
    if (data.user) {
      console.log("✅ Server-side auth: User found", data.user.email);
    return data.user;
    }
    console.log("❌ Server-side auth: No user in response");
    return null;
  } catch (error) {
    console.log("❌ Server-side auth error:", error.message);
    return null;
  }
}
