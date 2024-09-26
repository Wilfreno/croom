import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server";
import { WebSocketMessage } from "@/lib/types/websocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function LobbyChats() {
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

  return (
    <div className="bg-primary-foreground p-2 grid gap-6 h-full place-items-end overflow-y-auto">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index}>
          <p className="gap-4 prose">
            <strong className="mr-4">name:</strong>
            <span className="text-sm">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque
              necessitatibus quia repellendus. Adipisci consectetur accusantium
              tenetur non ex, doloremque ullam qui omnis dolorem voluptas harum
              iure. Et modi vitae placeat veritatis tempore exercitationem?
              Expedita esse necessitatibus aperiam cum consectetur ipsum
              voluptatem, nemo, aliquam vero reprehenderit officia. Placeat
              quisquam quam quo. Necessitatibus laudantium, error est
              consequatur consequuntur dolorem asperiores iste? Repudiandae sed
              deleniti ab fuga quos beatae ducimus tempore aut debitis. Iste
              expedita iusto ex corrupti, laboriosam illo. Voluptatum vero
              perspiciatis accusamus minima unde rem consequuntur ab et
              reprehenderit! Non quas sint doloribus explicabo quae optio
              tempora. Temporibus quas ipsum sunt.
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
