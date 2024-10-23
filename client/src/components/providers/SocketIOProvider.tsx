"use client";
import { ClientToServer, ServerToCLient } from "@/lib/types/socketio-types";
import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

const SocketIOContext = createContext<Socket<
  ServerToCLient,
  ClientToServer
> | null>(null);

export function useSocketIO() {
  return useContext(SocketIOContext);
}

export default function SocketIOProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const socket_url = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (!socket_url)
    throw new Error(
      "NEXT_PUBLIC_WEBSOCKET_URL is missing from your .env.local file"
    );

  const [socket, setSocket] = useState<Socket<
    ServerToCLient,
    ClientToServer
  > | null>(null);
  const { data } = useSession();

  useEffect(() => {
    if (!data) return;

    const socket: Socket<ServerToCLient, ClientToServer> = io(
      socket_url + "/ws/" + data.user.id
    );

    setSocket(socket);
    function onError(error: string) {
      toast(error);
    }
    socket.on("ERROR", onError);

    return () => {
      socket.off("ERROR", onError);
    };
  }, [data]);

  return (
    <SocketIOContext.Provider value={socket}>
      {children}
    </SocketIOContext.Provider>
  );
}
