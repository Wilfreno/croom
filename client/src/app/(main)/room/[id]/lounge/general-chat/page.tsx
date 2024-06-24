"use client";

import useServerUrl from "@/components/hooks/useServerUrl";
import { useToast } from "@/components/ui/use-toast";
import { LoungeMessage } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function page() {
  const params = useParams<{ id: string }>();
  const server_url = useServerUrl();
  const { toast } = useToast();
  const [messages, setMessages] = useState<LoungeMessage[]>();

  useEffect(() => {
    if (!params || !params.id) return;
    async function getMessages() {
      try {
        const response = await fetch(
          server_url + "/v1/room/lounge/messages/" + params.id
        );

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oop! something went wrong",
            description: response_json.message,
          });
          return;
        }
        setMessages(response_json.data as LoungeMessage[]);
      } catch (error) {
        throw error;
      }
    }
    async function getRoom() {
      try {
        const response = await 
      } catch (error) {
        throw error
      }
    }
    getMessages();
  }, [params]);



  return <section className="grow bg-secondary">
    <div>

    </div>
  </section>;
}
