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
    // Check if running locally and use local backend
    const isLocal = typeof window !== "undefined" && 
                    (window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1");
    
    let socketUrl = null;
    
    // If running locally, ALWAYS use local backend (ignore env vars)
    if (isLocal) {
      const localBackendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || "10000";
      socketUrl = `http://localhost:${localBackendPort}`;
      console.log(`🔧 Using local socket server: ${socketUrl} (running on localhost)`);
    } else {
      // For production, use env vars (must be set in production)
      socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                  process.env.NEXT_PUBLIC_API_URL;
      
      if (!socketUrl) {
        console.error("❌ Socket URL not configured! Set NEXT_PUBLIC_SOCKET_URL or NEXT_PUBLIC_API_URL");
        // Fallback - but this should never happen in production
        socketUrl = "https://chatx-boxb.onrender.com";
      }
    }

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

