"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import { useToast } from "@/components/ui/use-toast";
import { ServerResponse } from "@/lib/types/sever-response";
import { FriendRequest } from "@/lib/types/client-types";
import { WebSocketSeverMessage } from "@/lib/types/websocket-type";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function useFriendrequest() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );
  const friend_requests = useRef<FriendRequest[]>();

  const { data } = useSession();
  const websocket = useWebsocket();
  const { toast } = useToast();
  const router = useRouter();

  async function getFriendRequest() {
    const response = await fetch(
      server_url + "/get/friend-request/" + data?.user.id
    );

    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status === "OK")
      friend_requests.current = response_json.data as FriendRequest[];

    router.refresh();
  }

  async function accept(request: FriendRequest, index: number) {
    const response = await fetch(server_url + "/accept/friend-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: request.sender.id,
        receiver: data?.user.id,
      }),
    });
    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status === "OK") {
    } else {
      toast({
        title: "Something went wrong!",
        description: response_json.message,
      });
    }

    setTimeout(() => {
      friend_requests.current = friend_requests.current!.toSpliced(index, 1);
      router.refresh();
    }, 3000);
  }

  async function decline(request: FriendRequest, index: number) {
    const response = await fetch(server_url + "/decline/friend-request", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: request.sender.id,
        receiver: data?.user.id,
      }),
    });
    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status !== "OK") {
      toast({
        title: "Something went wrong!",
        description: response_json.message,
      });
    }

    setTimeout(() => {
      friend_requests.current = friend_requests.current!.toSpliced(index, 1);
      router.refresh();
    }, 3000);
  }

  useEffect(() => {
    websocket?.addEventListener("message", (socket) => {
      const message: WebSocketSeverMessage = JSON.parse(socket.data);

      if (message.type === "friend-request") getFriendRequest();
    });
  }, [websocket]);

  useEffect(() => {
    if (data && !friend_requests.current) getFriendRequest();
  }, [data]);
  return {
    friend_requests: friend_requests.current,
    accept,
    decline,
  };
}
