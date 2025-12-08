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
} from "../lib/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
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

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedUsername = username.trim();
    
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
      console.log(` User with username already exists:`);
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

    attachAuthCookie(res, user._id.toString());
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
    
    if (!email || !password) {
      console.log(" Missing email or password");
      return res.status(400).json({ error: "Email and password are required." });
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();
    console.log(` Searching for user with email: ${normalizedEmail}`);
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`User not found: ${normalizedEmail}`);
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
    attachAuthCookie(res, user._id.toString());
    console.log(` Login successful for: ${user.username} (${user.email})`);
    
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error(" Login error", error);
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

    // Check if email/username already exists (excluding current user)
    const normalizedEmail = email?.toLowerCase().trim();
    if (normalizedEmail || username) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: user.id } },
          {
            $or: [
              ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
              ...(username ? [{ username: username.trim() }] : []),
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
    if (username !== undefined) updateData.username = username.trim();
    if (normalizedEmail) updateData.email = normalizedEmail;
    if (phone !== undefined) updateData.phone = phone.trim();
    if (avatar !== undefined) updateData.avatar = avatar;

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
