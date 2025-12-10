import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import messageRoutes from "./routes/messages.js";
import uploadRoutes from "./routes/upload.js";
import debugRoutes from "./routes/debug.js";
import { initSocketServer } from "./socket/server.js";
import { connectDB } from "./lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder first, then try root folder
dotenv.config({ path: path.resolve(__dirname, ".env") });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

const app = express();
// Render uses process.env.PORT, fallback to BACKEND_PORT for local development
const PORT = process.env.PORT || process.env.BACKEND_PORT || 4000;
// For Render: Use CLIENT_URL env var, fallback to NEXT_PUBLIC_APP_URL, then localhost for dev
const CLIENT_URL = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Log for debugging deployment
console.log(" =========================================");
console.log(" 🚀 Backend Server Starting");
console.log(" =========================================");
console.log(" CORS CLIENT_URL:", CLIENT_URL);
console.log(" Server PORT:", PORT);
console.log(" NODE_ENV:", process.env.NODE_ENV || "development");
console.log(" All env vars check:");
console.log("   CLIENT_URL:", process.env.CLIENT_URL || "❌ NOT SET");
console.log("   NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "❌ NOT SET");
console.log("   MONGODB_URI:", process.env.MONGODB_URI ? "✅ SET" : "❌ NOT SET");
console.log("   JWT_SECRET:", process.env.JWT_SECRET ? "✅ SET" : "❌ NOT SET");
console.log("   CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ SET" : "❌ NOT SET");
console.log(" =========================================");

// CORS configuration - allow multiple origins
// Check if we're actually on Render (production deployment)
const isRenderProduction = process.env.RENDER === "true" || (process.env.NODE_ENV === "production" && process.env.CLIENT_URL?.includes("render.com"));
const allowedOrigins = CLIENT_URL.includes(",")
  ? CLIENT_URL.split(",").map(origin => origin.trim())
  : [CLIENT_URL];

// Always allow localhost for local development (when not on Render)
// Also allow if explicitly set in CLIENT_URL
if (!isRenderProduction) {
  if (!allowedOrigins.includes("http://localhost:3000")) {
    allowedOrigins.push("http://localhost:3000");
  }
}

console.log(" Allowed CORS origins:", allowedOrigins);
console.log(" Is Render production:", isRenderProduction);

// CORS middleware with explicit preflight handling
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log(" CORS: Request with no origin, allowing");
        return callback(null, true);
      }
      
      console.log(` CORS: Checking origin: ${origin}`);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(` CORS: ✅ Origin allowed: ${origin}`);
        callback(null, true);
      } else if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        // Always allow localhost origins (for local development testing)
        // This is safe because localhost can only be accessed from the developer's machine
        console.log(` CORS: ✅ Localhost allowed: ${origin}`);
        callback(null, true);
      } else {
        console.log(` CORS: ❌ Origin NOT allowed: ${origin}`);
        console.log(` CORS: Allowed origins are:`, allowedOrigins);
        callback(new Error(`CORS: Origin ${origin} is not allowed. Allowed origins: ${allowedOrigins.join(", ")}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

// Explicit OPTIONS handler as fallback (though cors should handle it)
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  console.log(` CORS: OPTIONS preflight request from: ${origin}`);
  
  if (!origin) {
    return res.sendStatus(204);
  }
  
  // Check if origin is allowed
  const isAllowed = allowedOrigins.includes(origin) || 
                    origin.includes("localhost") || 
                    origin.includes("127.0.0.1");
  
  if (isAllowed) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Expose-Headers", "Set-Cookie");
    return res.sendStatus(204);
  }
  
  return res.sendStatus(403);
});
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/debug", debugRoutes); // Debug routes (remove in production)

app.use((err, req, res, next) => {
  console.error("Unhandled backend error", err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);

// Initialize Socket.io server
initSocketServer(server);
console.log(" Socket.io server ready");

// Connect to MongoDB before starting server
async function startServer() {
  try {
   
    await connectDB();
    console.log(" MongoDB connected successfully!");

server.listen(PORT, () => {
  console.log(` Backend running at http://localhost:${PORT}`);
});
  } catch (error) {
    console.error(" MongoDB connection failed:", error.message);
    console.error(" Make sure MongoDB is running and MONGODB_URI is correct in .env file");
    process.exit(1);
  }
}

startServer();
