import { Router } from "express";
import { connectDB } from "../lib/db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = Router();

/**
 * Debug endpoint to check database state
 * GET /api/debug/users
 */
router.get("/users", async (req, res) => {
  try {
    await connectDB();
    
    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    const totalUsers = await User.countDocuments();
    const users = await User.find().limit(10).select("username email createdAt").lean();
    
    return res.json({
      database: {
        name: dbName,
        host: host,
        collections: collections.map(c => c.name),
      },
      users: {
        total: totalUsers,
        sample: users,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Debug endpoint to check specific user
 * GET /api/debug/user/:email
 */
router.get("/user/:email", async (req, res) => {
  try {
    await connectDB();
    
    const email = req.params.email.toLowerCase().trim();
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ 
        found: false,
        message: `No user found with email: ${email}` 
      });
    }
    
    return res.json({
      found: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Debug endpoint to delete all users (USE WITH CAUTION)
 * DELETE /api/debug/users
 */
router.delete("/users", async (req, res) => {
  try {
    await connectDB();
    
    const result = await User.deleteMany({});
    
    return res.json({
      success: true,
      deleted: result.deletedCount,
      message: "All users deleted. Database is now empty.",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;


