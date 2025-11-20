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

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000";

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: {
        userId: user.id,
      },
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

