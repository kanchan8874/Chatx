"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useSocket(user) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    // Use window.location.origin for same-origin, fallback to env or localhost
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" ? window.location.origin.replace(":3000", ":4000") : "http://localhost:4000");

    console.log(`🔌 Connecting to Socket.io server at: ${socketUrl}`);

    const socketInstance = io(socketUrl, {
      transports: ["polling", "websocket"], // Try polling first, then upgrade to websocket
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      auth: {
        userId: user.id,
      },
    });

    // Add error handlers
    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      console.error("   Socket URL:", socketUrl);
      console.error("   Error details:", error);
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket.io connected successfully");
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("⚠️ Socket.io disconnected:", reason);
    });

    socketRef.current = socketInstance;

    const handleConnect = () => {
      setSocket(socketInstance);
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocket(null);
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.id]);

  return { socket, isConnected };
}

