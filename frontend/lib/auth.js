import { serverFetch } from "./api-client";

export async function getCurrentUser() {
  try {
    const data = await serverFetch("/api/auth/me");
    return data.user;
  } catch (error) {
    return null;
  }
}
