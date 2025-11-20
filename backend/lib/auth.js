import { verifyJwt, signJwt } from "../lib/jwt.js";
import { connectDB } from "../lib/db.js";
import User from "../models/User.js";

export const AUTH_COOKIE_NAME = "chatx_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
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
  const token =
    request.cookies?.[AUTH_COOKIE_NAME] ||
    request.headers.authorization?.replace("Bearer ", "") ||
    null;

  return getUserFromToken(token);
}

export function attachAuthCookie(response, userId) {
  const token = signJwt({ sub: userId });
  response.cookie(AUTH_COOKIE_NAME, token, baseCookieOptions);
  return response;
}

export function clearAuthCookie(response) {
  response.cookie(AUTH_COOKIE_NAME, "", { ...baseCookieOptions, maxAge: 0 });
  return response;
}

