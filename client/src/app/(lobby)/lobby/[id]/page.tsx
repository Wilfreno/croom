"use client";
import PageLoading from "@/components/loading/PageLoading";
import LobbyChatSection from "@/components/page/lobby/LobbyChatSection";
import LobbyVideo from "@/components/page/lobby/LobbyVideo";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { GETRequest } from "@/lib/server/requests";
import { Lobby } from "@/lib/types/server-response-data";
import websocketMessage from "@/lib/websocket/websocket-message";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function Page({ params }: { params: { id: string } }) {
  const websocket = useWebsocket();
  const { data: session } = useSession();

  const { error, isFetching } = useQuery({
    queryKey: ["lobby", params.id],
    queryFn: async () => {
      const { data, message, status } = await GETRequest<Lobby>(
        "/v1/lobby/" + params.id
      );

      if (status !== "OK") {
        throw new Error(message);
      }

      return data;
    },
  });

  useEffect(() => {
    if (!websocket || !session || !websocket.OPEN) return;

    websocket.addEventListener("open", () => {
      websocket.send(
        websocketMessage("join", {
          user_id: session.user.id,
          lobby_id: params.id,
        })
      );
    });

    websocket.addEventListener("close", () => {
      websocket.send(
        websocketMessage("leave", {
          user_id: session.user.id,
          lobby_id: params.id,
        })
      );
    });
  }, [websocket, session]);

  if (isFetching) return <PageLoading />;

  if (error) throw error;

  return (
    <main className="flex w-full h-dvh overflow-hidden">
      <LobbyVideo />
      {/* <LobbyChatSection /> */}
    </main>
  );
}
