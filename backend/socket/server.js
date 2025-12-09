import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;
const onlineUsers = new Map();
const JWT_SECRET = process.env.JWT_SECRET || "local_dev_secret";
const SOCKET_ORIGIN = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Log for debugging deployment
console.log("🔌 Socket.io CORS configured for:", SOCKET_ORIGIN);

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

  io = new Server(server, {
    cors: {
      origin: SOCKET_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"], // Try polling first, then upgrade
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log(`🔌 Socket.io server initialized on ${SOCKET_ORIGIN}`);

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


