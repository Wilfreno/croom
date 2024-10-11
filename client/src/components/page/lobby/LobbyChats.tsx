import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server";
import { WebSocketMessage } from "@/lib/types/websocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function LobbyChats() {
  const websocket = useWebsocket();
  const params = useParams<{ id: string }>();

  const query_client = useQueryClient();
  const last_message = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    placeholderData: [],
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

    websocket.addEventListener("message", (event) => {
      const parsed_data = JSON.parse(event.data) as WebSocketMessage;

      const payload = parsed_data.payload as Message;

      switch (parsed_data.type) {
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

  useEffect(() => {
    if (!last_message) return;

    last_message.current?.scrollIntoView();
  }, [last_message]);

  return (
    <ScrollArea className="h-full grid content-end">
      <div className=" p-2 flex flex-col items-start self-end gap-4  overflow-y-auto">
        {messages?.map((message, index) => (
          <div
            key={message.id}
            ref={index === messages.length - 1 ? last_message : null}
          >
            <p className="gap-4 prose text-sm">
              <span className="mr-2 font-semibold text-primary">
                {message.sender.display_name}:
              </span>
              <span>{message.text}</span>
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
