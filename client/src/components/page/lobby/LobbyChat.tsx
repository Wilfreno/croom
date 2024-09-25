"use client";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { GETRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server";
import { WebSocketMessage } from "@/lib/types/websocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function LobbyChat() {
  const websocket = useWebsocket();
  const params = useParams<{ id: string }>();

  const query_client = useQueryClient();

  const { data: messages } = useQuery({
    initialData: [],
    queryKey: ["message", params.id],
    queryFn: async () => {
      const { data, message, status } = await GETRequest<Message[]>(
        "/v1/lobby/" + params.id + "/messages"
      );

      if (status !== "OK") {
        toast(message);
        throw new Error(message);
      }

      return data;
    },
  });

  useEffect(() => {
    if (!websocket) return;

    websocket.addEventListener("message", (raw_data) => {
      const parsed_message: WebSocketMessage = JSON.parse(raw_data.toString());

      const payload = parsed_message.payload as Message;

      switch (parsed_message.type) {
        case "send-message": {
          query_client.setQueryData<Message[]>(
            ["message", params.id],
            (messages) => [...messages!, payload]
          );

          break;
        }
        case "delete-message": {
          query_client.setQueryData<Message[]>(
            ["message", params.id],
            (messages) =>
              messages?.map((msg) => (msg.id === payload.id ? payload : msg))
          );

          break;
        }
        default:
          break;
      }
    });
  }, [websocket]);

  return <div className="bg-primary-foreground  w-80"></div>;
}
