import { serverFetch } from "./api-client-server";

export async function getCurrentUser() {
  try {
    const data = await serverFetch("/api/auth/me");
    if (data.user) {
      // Only log in development to avoid noise in production
      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Server-side auth: User found", data.user.email);
      }
      return data.user;
    }
    // No user is not an error - user is just not logged in
    return null;
  } catch (error) {
    // Don't log "Unauthorized" errors - they're normal when user is not logged in
    if (error.message.includes("Unauthorized") || error.message.includes("401")) {
      return null;
    }
    
    // Only log errors in development or if it's a connection error
    const isConnectionError = error.message.includes("Cannot connect") || 
                             error.message.includes("timeout") ||
                             error.message.includes("ECONNREFUSED");
    
    if (process.env.NODE_ENV !== "production" || isConnectionError) {
      console.error("❌ Server-side auth error:", error.message);
      
      // Log helpful message for connection errors
      if (isConnectionError) {
        console.log("💡 Tip: Make sure NEXT_PUBLIC_API_URL is set in Render environment variables");
        console.log("💡 Backend URL should be: https://chatx-boxb.onrender.com");
      }
    }
    
    // Return null on error - don't crash the page
    return null;
  }
}
