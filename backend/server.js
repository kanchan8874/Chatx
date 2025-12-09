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
const CLIENT_URL = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Log for debugging deployment
console.log("🌐 CORS configured for:", CLIENT_URL);
console.log("🚀 Server starting on port:", PORT);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
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

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((err, req, res, next) => {
  console.error("Unhandled backend error", err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);

// Initialize Socket.io server
initSocketServer(server);
console.log("🔌 Socket.io server ready");

// Connect to MongoDB before starting server
async function startServer() {
  try {
   
    await connectDB();
    console.log("✅ MongoDB connected successfully!");

server.listen(PORT, () => {
  console.log(`⚡️ Backend running at http://localhost:${PORT}`);
});
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("💡 Make sure MongoDB is running and MONGODB_URI is correct in .env file");
    process.exit(1);
  }
}

startServer();
