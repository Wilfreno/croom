"use client";
import PageLoading from "@/components/loading/PageLoading";
import LobbyChatSection from "@/components/page/lobby/LobbyChatSection";
import LobbyVideoSection from "@/components/page/lobby/LobbyVideoSection";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { GETRequest } from "@/lib/server/requests";
import { Lobby, ServerResponse } from "@/lib/types/server";
import websocketMessage from "@/lib/websocket/websocket-message";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import LobbyDoesNotExist from "./LobbyDoesNotExist";
import LobbyNotAMember from "./LobbyNotAMember";

export default function LobbyPage() {
  const params = useParams<{ id: string }>();

  const websocket = useWebsocket();
  const { data: session } = useSession();

  const {
    data: lobby,
    error,
    isFetching,
  } = useQuery<Lobby, ServerResponse["status"]>({
    queryKey: ["lobby", params.id],
    queryFn: async () => {
      const { data, message, status } = await GETRequest<Lobby>(
        "/v1/lobby/" + params.id
      );

      if (status !== "OK") {
        throw status;
      }

      return data;
    },
  });
  const is_member = useMemo(() => {
    if (!lobby || !session) return false;

    return lobby.members.some((member) => member.user.id === session.user.id);
  }, [lobby, session]);

  useEffect(() => {
    if (!websocket || !session) return;

    if (websocket.CONNECTING) {
      websocket.send(
        websocketMessage("join", {
          user_id: session.user.id,
          lobby_id: params.id,
        })
      );
    }

    return () => {
      if (websocket.CONNECTING)
        websocket.send(
          websocketMessage("leave", {
            user_id: session.user.id,
            lobby_id: params.id,
          })
        );
    };
  }, [websocket, session]);

  if (!is_member) return <LobbyNotAMember />;
  if (error === "NOT_FOUND") return <LobbyDoesNotExist />;

  return lobby ? (
    <main className="flex w-full h-full overflow-hidden">
      <LobbyVideoSection />
      <LobbyChatSection />
    </main>
  ) : (
    <PageLoading />
  );
}
