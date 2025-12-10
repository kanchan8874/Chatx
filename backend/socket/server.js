import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;
const onlineUsers = new Map();
const JWT_SECRET = process.env.JWT_SECRET || "local_dev_secret";
// For Render: Use CLIENT_URL env var, fallback to NEXT_PUBLIC_APP_URL, then localhost for dev
const SOCKET_ORIGIN = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const isRenderProduction = process.env.RENDER === "true" || (process.env.NODE_ENV === "production" && process.env.CLIENT_URL?.includes("render.com"));

// Log for debugging deployment
console.log("🔌 Socket.io CORS configured for:", SOCKET_ORIGIN);
console.log("🔌 Environment:", process.env.NODE_ENV || "development");
console.log("🔌 Is Render production:", isRenderProduction);

async function resolveUserId(socket) {
  const { token, userId } = socket.handshake.auth || {};
  if (userId) {
    return userId;
  }

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload?.sub || null;
  } catch (error) {
    return null;
  }
}

function broadcastOnlineUsers() {
  if (!io) return;
  io.emit("user:online", Array.from(onlineUsers.keys()));
}

function registerRoomEvents(socket, currentUserId) {
  socket.on("chat:join", (chatId) => {
    if (chatId) {
      const chatIdStr = chatId.toString();
      socket.join(chatIdStr);
      console.log(`    User ${currentUserId} joined chat room: ${chatIdStr}`);
      
      // Verify room membership
      const room = io.sockets.adapter.rooms.get(chatIdStr);
      const roomSize = room ? room.size : 0;
      console.log(`    Room ${chatIdStr} now has ${roomSize} user(s)`);
    } else {
      console.log(`    Invalid chatId received for join: ${chatId}`);
    }
  });

  socket.on("chat:leave", (chatId) => {
    if (chatId) {
      const chatIdStr = chatId.toString();
      socket.leave(chatIdStr);
      console.log(`    User ${currentUserId} left chat room: ${chatIdStr}`);
      
      // Verify room membership after leave
      const room = io.sockets.adapter.rooms.get(chatIdStr);
      const roomSize = room ? room.size : 0;
      console.log(`    Room ${chatIdStr} now has ${roomSize} user(s)`);
    } else {
      console.log(`    Invalid chatId received for leave: ${chatId}`);
    }
  });

  socket.on("typing:start", ({ chatId, user }) => {
    if (!chatId) return;
    socket.to(chatId).emit("typing:start", {
      chatId,
      user: user || currentUserId,
    });
  });

  socket.on("typing:stop", ({ chatId, user }) => {
    if (!chatId) return;
    socket.to(chatId).emit("typing:stop", {
      chatId,
      user: user || currentUserId,
    });
  });
}

export function initSocketServer(server) {
  if (io) {
    return io;
  }

  // Allow multiple origins for CORS
  const allowedOrigins = SOCKET_ORIGIN.includes(",") 
    ? SOCKET_ORIGIN.split(",").map(origin => origin.trim())
    : [SOCKET_ORIGIN];

  // Always allow localhost for local development (when not on Render)
  // Also allow if explicitly set in SOCKET_ORIGIN
  if (!isRenderProduction) {
    if (!allowedOrigins.includes("http://localhost:3000")) {
      allowedOrigins.push("http://localhost:3000");
    }
  }

  console.log(`🔌 Socket.io allowed origins:`, allowedOrigins);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          console.log("🔌 Socket.io CORS: Request with no origin, allowing");
          return callback(null, true);
        }
        
        console.log(`🔌 Socket.io CORS: Checking origin: ${origin}`);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          console.log(`🔌 Socket.io CORS: ✅ Origin allowed: ${origin}`);
          callback(null, true);
        } else if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          // Always allow localhost origins (for local development testing)
          // This is safe because localhost can only be accessed from the developer's machine
          console.log(`🔌 Socket.io CORS: ✅ Localhost allowed: ${origin}`);
          callback(null, true);
        } else {
          console.log(`🔌 Socket.io CORS: ❌ Origin NOT allowed: ${origin}`);
          console.log(`🔌 Socket.io CORS: Allowed origins are:`, allowedOrigins);
          callback(new Error(`Socket.io CORS: Origin ${origin} is not allowed. Allowed origins: ${allowedOrigins.join(", ")}`));
        }
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"], // Try polling first, then upgrade
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log(`🔌 Socket.io server initialized`);

  io.on("connection", async (socket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);
    
    const currentUserId = await resolveUserId(socket);
    console.log(`   User ID: ${currentUserId || "Unauthenticated"}`);

    if (currentUserId) {
      onlineUsers.set(currentUserId, socket.id);
      broadcastOnlineUsers();
      console.log(` User ${currentUserId} is now online`);
    } else {
      console.log(" Unauthenticated socket connection");
    }

    registerRoomEvents(socket, currentUserId);

    socket.on("disconnect", (reason) => {
      console.log(` Socket disconnected: ${socket.id}, reason: ${reason}`);
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        broadcastOnlineUsers();
        console.log(`   User ${currentUserId} is now offline`);
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io server has not been initialised yet.");
  }
  return io;
}

export function emitNewMessage(message) {
  if (!io) {
    console.log(" Socket.io not initialized, cannot emit message");
    return;
  }

  const safeMessage = {
    ...message,
    chatId: (message.chatId || message.chat)?.toString(),
  };

  console.log(" Emitting message via socket:");
  console.log("   Chat ID:", safeMessage.chatId);
  console.log("   Message ID:", safeMessage.id);
  console.log("   Text:", safeMessage.text?.substring(0, 50));
  
  // Get all sockets in the room to verify
  const room = io.sockets.adapter.rooms.get(safeMessage.chatId);
  const roomSize = room ? room.size : 0;
  console.log(`    Users in room ${safeMessage.chatId}: ${roomSize}`);
  
  if (roomSize === 0) {
    console.log("    WARNING: No users in room! Message might not be delivered.");
  }
  
  // Emit to all users in the chat room
  io.to(safeMessage.chatId).emit("chat:message", safeMessage);
  console.log(`   Emitted 'chat:message' to room: ${safeMessage.chatId}`);
  
  // Also emit a refresh event for sidebar updates (broadcast to all)
  io.emit("chat:refresh", {
    chatId: safeMessage.chatId,
    preview: safeMessage.text,
    message: safeMessage,
  });
  console.log(`    Emitted 'chat:refresh' to all clients`);
}


