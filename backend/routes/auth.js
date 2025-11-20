import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { connectDB } from "../lib/db.js";
import {
  attachAuthCookie,
  clearAuthCookie,
  getUserFromRequest,
  sanitizeUser,
} from "../lib/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }],
    });

    if (existingUser) {
      return res.status(409).json({ error: "A user with that email or username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: avatar || "",
    });

    attachAuthCookie(res, user._id.toString());
    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Register error", error);
    return res.status(500).json({ error: "Unable to register user." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    attachAuthCookie(res, user._id.toString());
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("Login error", error);
    return res.status(500).json({ error: "Unable to log in." });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true });
});

router.get("/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ user });
});

export default router;
