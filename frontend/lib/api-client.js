import { API_BASE_URL, AUTH_COOKIE_NAME } from "./constants";

/**
 * Browser API client for use in Client Components
 */
export function getBrowserApiBase() {
  // Check if we're running locally (development)
  const isLocal = typeof window !== "undefined" && 
                  (window.location.hostname === "localhost" || 
                   window.location.hostname === "127.0.0.1");
  
  // If running locally, prioritize local backend
  // Check for explicit local backend port first
  if (isLocal) {
    const localBackendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "10000";
    const localBackendUrl = `http://localhost:${localBackendPort}`;
    
    // If no explicit API URL is set, or if it's set to production, use local backend
    const explicitApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL;
    
    if (!explicitApiUrl || explicitApiUrl.includes("render.com") || explicitApiUrl.includes("onrender.com")) {
      console.log(`🔧 Using local backend: ${localBackendUrl} (running on localhost)`);
      return localBackendUrl;
    }
    
    // If explicit URL is set and it's not production, use it
    console.log(`🔧 Using explicit API URL: ${explicitApiUrl}`);
    return explicitApiUrl;
  }
  
  // Otherwise use environment variable or fallback to production
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
                 process.env.API_BASE_URL ||
                 "https://chatx-boxb.onrender.com";
  
  console.log(`🔧 Using API URL: ${apiUrl}`);
  return apiUrl;
}

/**
 * Client-side fetch function for browser use
 */
export async function clientFetch(path, options = {}) {
  const apiBase = getBrowserApiBase();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${apiBase}${path}`, {
    method: options.method || "GET",
    headers,
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}
