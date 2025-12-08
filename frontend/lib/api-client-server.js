import { cookies } from "next/headers";
import { API_BASE_URL, AUTH_COOKIE_NAME } from "./constants";

/**
 * Server-side API client for use in Server Components only
 * Note: In Next.js 16+, cookies() returns a Promise and must be awaited
 */
export async function serverFetch(path, options = {}) {
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    cache: "no-store",
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

