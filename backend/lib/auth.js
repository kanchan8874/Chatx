import { verifyJwt, signJwt } from "../lib/jwt.js";
import { connectDB } from "../lib/db.js";
import User from "../models/User.js";

export const AUTH_COOKIE_NAME = "chatx_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days


const baseCookieOptions = {
    httpOnly: true,
  sameSite: "lax", // "lax" works for same-site (localhost is same-site regardless of port)
  secure: false, // false for localhost HTTP
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  // Don't set domain - allows cookie to work across localhost ports
  };

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

export function attachAuthCookie(response, userId) {
  const token = signJwt({ sub: userId });
  const cookieOptions = { ...baseCookieOptions };
  
  console.log(` Setting cookie: ${AUTH_COOKIE_NAME}`);
  console.log(`   Options:`, {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path,
    maxAge: cookieOptions.maxAge,
  });
  
  response.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
  return response;
}

export function clearAuthCookie(response) {
  response.cookie(AUTH_COOKIE_NAME, "", { ...baseCookieOptions, maxAge: 0 });
  return response;
}

