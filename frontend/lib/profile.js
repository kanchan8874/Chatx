import { clientFetch } from "./api-client";

/**
 * Get current user profile
 */
export async function getProfile() {
  try {
    const data = await clientFetch("/api/auth/profile");
    return data.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates) {
  try {
    const data = await clientFetch("/api/auth/profile", {
      method: "PUT",
      body: updates,
    });
    return data.user;
  } catch (error) {
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await clientFetch("/api/auth/logout", {
      method: "POST",
    });
    return true;
  } catch (error) {
    // Even if API fails, clear local state
    return true;
  }
}

