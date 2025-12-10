import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./constants";

/**
 * Get API base URL for server-side rendering
 * Priority: NEXT_PUBLIC_API_URL > API_BASE_URL > fallback
 */
function getServerApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:4000"
  );
}

/**
 * Server-side API client for use in Server Components only
 * Note: In Next.js 16+, cookies() returns a Promise and must be awaited
 */
export async function serverFetch(path, options = {}) {
  const apiBase = getServerApiBase();
  const url = `${apiBase}${path}`;

  try {
    const cookieStore = await cookies();
    let token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    // If token not found, try getting from all cookies
    if (!token) {
      const allCookies = cookieStore.getAll();
      const authCookie = allCookies.find((c) => c.name === AUTH_COOKIE_NAME);
      token = authCookie?.value;
    }

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // Add cookie to request headers for backend
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers.Cookie = `${AUTH_COOKIE_NAME}=${token}`;
    }

    // Add timeout for server-side requests (5 seconds - Render free tier can be slow)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      
      // 401 Unauthorized is a normal state (user not logged in) - don't throw error
      if (response.status === 401) {
        return { user: null };
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === "AbortError") {
        throw new Error(`Request timeout: Backend not responding at ${apiBase}`);
      }
      
      // More detailed error for debugging
      if (fetchError.message.includes("ECONNREFUSED") || fetchError.message.includes("ENOTFOUND")) {
        throw new Error(`Cannot connect to backend at ${apiBase}. Check NEXT_PUBLIC_API_URL environment variable.`);
      }
      
      throw fetchError;
    }
  } catch (error) {
    // Don't log 401 Unauthorized as errors - it's a normal state
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      return { user: null };
    }
    
    // Log error details for debugging (only in development)
    if (process.env.NODE_ENV !== "production") {
      console.error(`Server-side fetch error for ${url}:`, error.message);
      console.error(`API Base URL: ${apiBase}`);
      console.error(`Full URL: ${url}`);
    }
    throw error;
  }
}

