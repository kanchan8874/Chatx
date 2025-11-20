import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;
const onlineUsers = new Map();
const JWT_SECRET = process.env.JWT_SECRET || "local_dev_secret";
const SOCKET_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";

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
      socket.join(chatId);
    }
  });

  socket.on("chat:leave", (chatId) => {
    if (chatId) {
      socket.leave(chatId);
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
    },
  });

  io.on("connection", async (socket) => {
    const currentUserId = await resolveUserId(socket);

    if (currentUserId) {
      onlineUsers.set(currentUserId, socket.id);
      broadcastOnlineUsers();
    }

    registerRoomEvents(socket, currentUserId);

    socket.on("disconnect", () => {
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        broadcastOnlineUsers();
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
    return;
  }

  const safeMessage = {
    ...message,
    chatId: message.chatId || message.chat,
  };

  io.to(safeMessage.chatId).emit("chat:message", safeMessage);
  io.emit("chat:refresh", {
    chatId: safeMessage.chatId,
    preview: safeMessage.text,
    message: safeMessage,
  });
}


