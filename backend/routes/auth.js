import { Router } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { connectDB } from "../lib/db.js";
import {
  attachAuthCookie,
  clearAuthCookie,
  getUserFromRequest,
  sanitizeUser,
  AUTH_COOKIE_NAME,
} from "../lib/auth.js";
import { validateEmail, validatePassword, validateUsername } from "../lib/validation.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body || {};
    
    // Validate all fields
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({ error: usernameValidation.error });
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ error: emailValidation.error });
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Connect to MongoDB
    try {
    await connectDB();
    } catch (dbError) {
      console.error(" Database connection failed during registration:", dbError.message);
      return res.status(500).json({ 
        error: "Database connection failed. Please check your MongoDB configuration." 
      });
    }

    const normalizedEmail = emailValidation.normalized;
    const trimmedUsername = usernameValidation.normalized;
    
    console.log(` Checking for existing user: email=${normalizedEmail}, username=${trimmedUsername}`);
    console.log(` Current database: ${mongoose.connection.name}`);
    console.log(` Current collection: ${User.collection.name}`);
    
    // Check by email
    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      console.log(` User with email already exists:`);
      console.log(`   - ID: ${existingByEmail._id}`);
      console.log(`   - Email: ${existingByEmail.email}`);
      console.log(`   - Username: ${existingByEmail.username}`);
      console.log(`   - Created: ${existingByEmail.createdAt}`);
      return res.status(409).json({ 
        error: "A user with that email already exists.",
        details: "Email is already registered. Please use a different email or try logging in."
      });
    }
    
    // Check by username
    const existingByUsername = await User.findOne({ username: trimmedUsername });
    if (existingByUsername) {
      console.log(`⚠️ User with username already exists:`);
      console.log(`   - ID: ${existingByUsername._id}`);
      console.log(`   - Email: ${existingByUsername.email}`);
      console.log(`   - Username: ${existingByUsername.username}`);
      console.log(`   - Created: ${existingByUsername.createdAt}`);
      return res.status(409).json({ 
        error: "A user with that username already exists.",
        details: "Username is already taken. Please choose a different username."
      });
    }
    
    // Count total users for debugging
    const totalUsers = await User.countDocuments();
    console.log(` Total users in database: ${totalUsers}`);
    
    console.log(` No existing user found. Proceeding with registration...`);

    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log(` Creating new user in database...`);
    const user = await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      avatar: avatar || "",
    });

    console.log(` User registered successfully!`);
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Database: ${user.constructor.db.name}`);
    console.log(`   - Collection: ${user.constructor.collection.name}`);

    attachAuthCookie(res, user._id.toString(), req);
    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error(" Register error:", error);
    
    // Provide more specific error messages
    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(409).json({ error: "A user with that email or username already exists." });
    }
    
    if (error.message.includes("MongoDB") || error.message.includes("connection")) {
      return res.status(500).json({ 
        error: "Database connection error. Please check your MongoDB configuration." 
      });
    }
    
    return res.status(500).json({ 
      error: error.message || "Unable to register user. Please try again." 
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    console.log(` Login attempt: email=${email}`);
    
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      console.log(" Invalid email format");
      return res.status(400).json({ error: emailValidation.error });
    }
    
    if (!password || password.trim() === "") {
      console.log(" Missing password");
      return res.status(400).json({ error: "Password is required." });
    }

    await connectDB();
    const normalizedEmail = emailValidation.normalized;
    console.log(` Searching for user with email: ${normalizedEmail}`);
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(` User not found: ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials." });
    }

    console.log(` User found: ${user.username} (${user.email})`);
    console.log(` Verifying password...`);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log(` Invalid password for user: ${normalizedEmail}`);
      return res.status(401).json({ error: "Invalid credentials." });
    }

    console.log(` Password verified. Setting auth cookie...`);
    attachAuthCookie(res, user._id.toString(), req);
    console.log(`Login successful for: ${user.username} (${user.email})`);
    
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error(" Login error", error);
    return res.status(500).json({ error: "Unable to log in." });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res, req);
  return res.json({ success: true });
});

router.get("/me", async (req, res) => {
  // Debug cookie headers
  console.log("🔍 /me endpoint - Checking authentication");
  console.log("   Request origin:", req.headers.origin || "none");
  console.log("   Request referer:", req.headers.referer || "none");
  console.log("   Cookie header:", req.headers.cookie || "none");
  console.log("   Parsed cookies:", req.cookies || {});
  console.log("   Auth cookie value:", req.cookies?.[AUTH_COOKIE_NAME] || "NOT FOUND");
  // Debug cookie reception
  console.log("🔍 /api/auth/me request received");
  console.log("   Origin:", req.headers.origin);
  console.log("   Cookie header:", req.headers.cookie ? "present" : "missing");
  console.log("   Parsed cookies:", req.cookies);
  console.log("   Auth cookie value:", req.cookies?.chatx_token ? "present" : "missing");
  
  const user = await getUserFromRequest(req);
  if (!user) {
    console.log("   ❌ No user found - returning 401");
    console.log("   Debug info:", {
      hasCookies: !!req.cookies,
      hasCookieHeader: !!req.headers.cookie,
      cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
      authCookiePresent: !!req.cookies?.chatx_token,
    });
    return res.status(401).json({ error: "Unauthorized" });
  }
  console.log("   ✅ User found:", user.email);
  return res.json({ user });
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.json({ user });
  } catch (error) {
    console.error("Get profile error", error);
    return res.status(500).json({ error: "Unable to fetch profile." });
  }
});

// Update user profile
router.put("/profile", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await connectDB();
    const { username, email, phone, avatar } = req.body || {};

    // Validate fields
    let usernameValidation = null;
    let emailValidation = null;
    
    if (username !== undefined) {
      usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        return res.status(400).json({ error: usernameValidation.error });
      }
    }
    
    if (email !== undefined) {
      emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return res.status(400).json({ error: emailValidation.error });
      }
    }
    
    // Check if email/username already exists (excluding current user)
    const normalizedEmail = emailValidation ? emailValidation.normalized : undefined;
    const normalizedUsername = usernameValidation ? usernameValidation.normalized : undefined;
    
    if (normalizedEmail || normalizedUsername) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: user.id } },
          {
            $or: [
              ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
              ...(normalizedUsername ? [{ username: normalizedUsername }] : []),
            ],
          },
        ],
      });

      if (existingUser) {
        return res.status(409).json({ error: "Email or username already in use." });
      }
    }

    // Update user
    const updateData = {};
    if (usernameValidation) {
      updateData.username = usernameValidation.normalized;
    }
    if (normalizedEmail) {
      updateData.email = normalizedEmail;
    }
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(user.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({ user: sanitizeUser(updatedUser) });
  } catch (error) {
    console.error("Update profile error", error);
    return res.status(500).json({ error: "Unable to update profile." });
  }
});

export default router;
