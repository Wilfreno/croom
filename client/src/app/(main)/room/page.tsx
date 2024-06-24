"use client";

import useServerUrl from "@/components/hooks/useServerUrl";
import { useToast } from "@/components/ui/use-toast";
import { Room } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function page() {
  const [rooms, setRooms] = useState<Room[]>();
  const { data } = useSession();
  const server_url = useServerUrl();
  const { toast } = useToast();
  useEffect(() => {
    if (!data) return;
    async function getRooms() {
      try {
        const response = await fetch(server_url + "/v1/user/room/:id");

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! something went wrong",
            description: response_json.message,
          });
          return;
        }

        setRooms(response_json.data as Room[]);
      } catch (error) {
        throw error;
      }
    }
    getRooms();
  }, [data]);

  return <main className="grow"></main>;
}
