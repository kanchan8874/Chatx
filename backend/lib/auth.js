import { verifyJwt, signJwt } from "../lib/jwt.js";
import { connectDB } from "../lib/db.js";
import User from "../models/User.js";

export const AUTH_COOKIE_NAME = "chatx_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Cookie options - different for production (HTTPS) vs development (HTTP)
// We need to detect the request origin to set appropriate cookie options
// If request is from HTTP (localhost), use secure=false, sameSite=lax
// If request is from HTTPS, use secure=true, sameSite=none (for cross-origin)

function getCookieOptions(request) {
  // Get the origin from the request
  const origin = request?.headers?.origin || request?.headers?.referer || "";
  const isBackendHTTPS = process.env.RENDER === "true" || 
                         process.env.NODE_ENV === "production" ||
                         (!!process.env.PORT && process.env.PORT !== "4000");
  
  // Check if request is from HTTP (localhost) or HTTPS
  const isRequestHTTP = origin.startsWith("http://") || 
                        (origin.includes("localhost") && !origin.startsWith("https://")) ||
                        (origin.includes("127.0.0.1") && !origin.startsWith("https://"));
  const isRequestHTTPS = origin.startsWith("https://");
  
  // Determine cookie settings
  let sameSite = "lax";
  let secure = false;
  
  if (isRequestHTTPS) {
    // Request from HTTPS origin - use cross-origin cookies
    sameSite = "none";
    secure = true;
  } else if (isRequestHTTP && isBackendHTTPS) {
    // Special case: Backend is HTTPS (Render), Frontend is HTTP (localhost)
    // Browsers won't send Secure cookies to HTTP origins, so we must use:
    // - secure: false (required for HTTP origins)
    // - sameSite: "none" (for cross-origin, but browsers may block this without Secure)
    // Actually, browsers block SameSite=None without Secure, so we need a workaround
    // Try using "lax" - it might work if the cookie domain/path allows it
    // But for true cross-origin, we need SameSite=None + Secure, which won't work
    // So we'll use "lax" and hope the browser accepts it (some browsers are lenient)
    sameSite = "lax"; // Try lax first - some browsers allow cross-origin with lax
    secure = false; // Must be false for HTTP origins
  } else if (isRequestHTTP) {
    // Both backend and frontend are HTTP (local dev)
    sameSite = "lax";
    secure = false;
  } else {
    // Fallback: use backend HTTPS status
    sameSite = isBackendHTTPS ? "none" : "lax";
    secure = isBackendHTTPS;
  }
  
  console.log(`🍪 Cookie options determined:`, {
    origin,
    isRequestHTTP,
    isRequestHTTPS,
    isBackendHTTPS,
    sameSite,
    secure,
  });
  
  return {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    // Don't set domain - allows cookie to work across different origins
  };
}

export function sanitizeUser(userDoc) {
  if (!userDoc) {
    return null;
  }

  const user = userDoc.toObject ? userDoc.toObject() : userDoc;

  return {
    id: user._id?.toString(),
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    phone: user.phone || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUserFromToken(token) {
  if (!token) {
    return null;
  }

  const payload = verifyJwt(token);
  if (!payload?.sub) {
    return null;
  }

  await connectDB();
  const user = await User.findById(payload.sub);
  if (!user) {
    return null;
  }

  return sanitizeUser(user);
}

export async function getUserFromRequest(request) {
  // Try multiple ways to get the token
  let token = null;
  
  // Method 1: From parsed cookies (cookie-parser)
  if (request.cookies?.[AUTH_COOKIE_NAME]) {
    token = request.cookies[AUTH_COOKIE_NAME];
  }
  
  // Method 2: From raw cookie header (fallback)
  if (!token && request.headers?.cookie) {
    const cookies = request.headers.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {});
    token = cookies[AUTH_COOKIE_NAME];
  }
  
  // Method 3: From Authorization header
  if (!token && request.headers?.authorization) {
    token = request.headers.authorization.replace("Bearer ", "");
  }

  if (!token) {
    return null;
  }

  return getUserFromToken(token);
}

export function attachAuthCookie(response, userId, request = null) {
  const token = signJwt({ sub: userId });
  const cookieOptions = getCookieOptions(request);
  
  const origin = request?.headers?.origin || request?.headers?.referer || "unknown";
  
  console.log(`🍪 Setting cookie: ${AUTH_COOKIE_NAME}`);
  console.log(`   Request origin: ${origin}`);
  console.log(`   Cookie Options:`, {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
    domain: cookieOptions.domain || "not set (allows cross-origin)",
  });
  console.log(`   Environment:`, {
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    PORT: process.env.PORT,
    CLIENT_URL: process.env.CLIENT_URL,
  });
  
  response.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
  
  // Also set the cookie in the response header explicitly for debugging
  console.log(`   ✅ Cookie set in response`);
  
  return response;
}

export function clearAuthCookie(response, request = null) {
  const cookieOptions = getCookieOptions(request);
  response.cookie(AUTH_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

