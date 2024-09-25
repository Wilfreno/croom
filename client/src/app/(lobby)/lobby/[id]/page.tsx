"use client";
import LobbyChat from "@/components/page/lobby/LobbyChat";
import LobbyVideo from "@/components/page/lobby/LobbyVideo";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import websocketMessage from "@/lib/websocket/websocket-message";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function Page({ params }: { params: { id: string } }) {
  const websocket = useWebsocket();
  const { data  } = useSession();

  useEffect(() => {
    if (!websocket || !data) return;

    if (websocket.CONNECTING) {
      websocket.send(
        websocketMessage("join", { user_id: data.user.id, lobby_id: params.id })
      );
    }

    return () => {
      if (websocket.CONNECTING)
        websocket.send(
          websocketMessage("leave", {
            user_id: data.user.id,
            lobby_id: params.id,
          })  
        );
    };
  }, [websocket, data]);

  return (
    <main className="grid grid-cols-[1fr_auto] w-full h-full">
      <LobbyVideo />
      <LobbyChat />
    </main>
  );
}
