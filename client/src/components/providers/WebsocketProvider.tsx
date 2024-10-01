"use client";
import { WebSocketMessage } from "@/lib/types/websocket";
import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const WebsocketContext = createContext<WebSocket | null>(null);

export function useWebsocket() {
  return useContext(WebsocketContext);
}

export default function WebsocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const websocket_url = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (!websocket_url)
    throw new Error(
      "NEXT_PUBLIC_WEBSOCKET_URL is missing from your .env.local file"
    );

  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const { data } = useSession();

  useEffect(() => {
    if (!data) return;

    const ws = new WebSocket(websocket_url + "/ws/" + data.user.id);
    setWebsocket(ws);

    ws.addEventListener("message", (raw_data) => {
      const parsed_data = JSON.parse(raw_data.toString()) as WebSocketMessage;

      if (parsed_data.type === "error") {
        toast(parsed_data.payload as string);
        throw new Error(parsed_data.payload as string);
      }
    });
    }, [data]);

  return (
    <WebsocketContext.Provider value={websocket}>
      {children}
    </WebsocketContext.Provider>
  );
}
