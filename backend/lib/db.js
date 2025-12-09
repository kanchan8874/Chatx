import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder first, then try root folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

// MongoDB URI - must be set in production (MongoDB Atlas)
// Only fallback to localhost for local development
const MONGODB_URI =
  process.env.MONGODB_URI || (process.env.NODE_ENV === "production" ? null : "mongodb://127.0.0.1:27017/chatx");

if (!MONGODB_URI) {
  console.error(" ERROR: MONGODB_URI is not defined!");
  console.error(" For Render deployment, you must set MONGODB_URI in environment variables.");
  console.error(" Use MongoDB Atlas connection string (mongodb+srv://...)");
  throw new Error("MONGODB_URI is not defined in your environment variables.");
}

// Check if password placeholder exists
if (MONGODB_URI.includes("<db_password>")) {
  console.error(" ERROR: MongoDB URI contains <db_password> placeholder!");
  console.error(" Please replace <db_password> with your actual MongoDB password in .env file");
  throw new Error("MongoDB password not configured. Please update MONGODB_URI in .env file.");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Ensure database name is in URI
    let connectionUri = MONGODB_URI;
    // Check if database name is missing
    if (connectionUri.includes("mongodb+srv://")) {
      // Check if URI has /? or ends with ? (no database name)
      if (connectionUri.includes("/?") || connectionUri.match(/@[^\/]+\?/)) {
        // Replace /? with /chatx? or add /chatx before ?
        connectionUri = connectionUri.replace("/?", "/chatx?").replace(/(@[^\/]+)\?/, "$1/chatx?");
      } else if (!connectionUri.match(/\/[^\/\?]+(\?|$)/)) {
        // If no database name at all, add it before ?
        if (connectionUri.includes("?")) {
          connectionUri = connectionUri.replace("?", "/chatx?");
        } else {
          connectionUri = connectionUri + "/chatx";
        }
      }
    }
    
    console.log(` Connecting to MongoDB with URI: ${connectionUri.replace(/:[^:@]+@/, ":****@")}`);

    cached.promise = mongoose
      .connect(connectionUri, opts)
      .then((mongooseInstance) => {
        const dbName = mongooseInstance.connection.name;
        const host = mongooseInstance.connection.host;
        console.log(` Connected to MongoDB: ${dbName} on ${host}`);
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(" MongoDB connection error:", error.message);
        if (error.message.includes("authentication failed")) {
          console.error(" Check your MongoDB username and password in .env file");
        } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
          console.error(" Check your MongoDB cluster URL in .env file");
        }
        throw error;
      });
  }

  try {
  cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

