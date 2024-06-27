"use client";

import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useToast } from "@/components/ui/use-toast";
import { Room } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function page() {
  const [rooms, setRooms] = useState<Room[]>();

  const { data } = useSession();
  const { toast } = useToast();
  const http_request = useHTTPRequest();

  useEffect(() => {
    if (!data) return;
    async function getRooms() {
      try {
        setRooms((await http_request.GET("/v1/user/room/:id")) as Room[]);
      } catch (error) {
        throw error;
      }
    }
    getRooms();
  }, [data]);

  return <main className="grow"></main>;
}
