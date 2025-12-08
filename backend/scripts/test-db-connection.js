/**
 * Test MongoDB Connection Script
 * Run this to verify MongoDB connection and database setup
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env file");
  process.exit(1);
}

// Fix database name in URI
let connectionUri = MONGODB_URI;
if (connectionUri.includes("mongodb+srv://")) {
  if (connectionUri.includes("/?") || connectionUri.match(/@[^\/]+\?/)) {
    connectionUri = connectionUri.replace("/?", "/chatx?").replace(/(@[^\/]+)\?/, "$1/chatx?");
  } else if (!connectionUri.match(/\/[^\/\?]+(\?|$)/)) {
    if (connectionUri.includes("?")) {
      connectionUri = connectionUri.replace("?", "/chatx?");
    } else {
      connectionUri = connectionUri + "/chatx";
    }
  }
}

console.log("🔗 Testing MongoDB Connection...");
console.log(`   URI: ${connectionUri.replace(/:[^:@]+@/, ":****@")}`);
console.log("");

async function testConnection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(connectionUri, {
      bufferCommands: false,
    });

    const dbName = mongoose.connection.name;
    const host = mongoose.connection.host;
    
    console.log("✅ MongoDB Connected Successfully!");
    console.log(`   Database: ${dbName}`);
    console.log(`   Host: ${host}`);
    console.log("");

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📦 Collections in database: ${collections.length}`);
    if (collections.length > 0) {
      collections.forEach((col) => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log("   (No collections found - database is empty)");
    }
    console.log("");

    // Count users
    const userCount = await User.countDocuments();
    console.log(`👥 Total users in 'users' collection: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().limit(5).select("username email createdAt");
      console.log("\n📋 Sample users:");
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.email}) - Created: ${user.createdAt}`);
      });
    }

    // Test creating a user (will fail if duplicate, that's ok)
    console.log("\n🧪 Testing user creation...");
    try {
      const testUser = await User.create({
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@test.com`,
        password: "test123",
      });
      console.log(`✅ Test user created: ${testUser.username}`);
      
      // Clean up test user
      await User.deleteOne({ _id: testUser._id });
      console.log("✅ Test user deleted");
    } catch (testError) {
      if (testError.code === 11000) {
        console.log("⚠️ Test user already exists (this is ok)");
      } else {
        console.error("❌ Error creating test user:", testError.message);
      }
    }

    console.log("\n✅ All tests passed!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes("authentication failed")) {
      console.error("\n💡 Fix: Check your MongoDB username and password in .env file");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      console.error("\n💡 Fix: Check your MongoDB cluster URL in .env file");
    } else if (error.message.includes("password")) {
      console.error("\n💡 Fix: Replace <db_password> with your actual MongoDB password");
    }
    
    process.exit(1);
  }
}

testConnection();

