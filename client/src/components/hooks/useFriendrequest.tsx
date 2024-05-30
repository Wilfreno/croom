"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import { useToast } from "@/components/ui/use-toast";
import { ServerResponse } from "@/lib/types/sever-response";
import { FriendRequest } from "@/lib/types/client-types";
import { WebSocketSeverMessage } from "@/lib/types/websocket-type";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { useDispatch } from "react-redux";
import { setNewFriendRequestList } from "@/lib/redux/slices/friend-requests-slice";
import { NotificationType } from "@/lib/types/notification-type";

export default function useFriendRequestHandler() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );
  const friend_request_list = useAppSelector(
    (state) => state.friend_request_list_reducer
  );
  const dispatch = useDispatch<AppDispatch>();

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
      dispatch(setNewFriendRequestList(response_json.data as FriendRequest[]));
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
      dispatch(
        setNewFriendRequestList(friend_request_list.toSpliced(index, 1))
      );
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
      dispatch(
        setNewFriendRequestList(friend_request_list.toSpliced(index, 1))
      );
      router.refresh();
    }, 3000);
  }

  useEffect(() => {
    websocket?.addEventListener("message", (socket) => {
      const message: WebSocketSeverMessage = JSON.parse(socket.data);

      const notification = message.payload as NotificationType;
      if (message.type === "friend-request")
        dispatch(
          setNewFriendRequestList([
            ...friend_request_list,
            notification.content!,
          ])
        );
    });
  }, [websocket]);

  useEffect(() => {
    if (data && friend_request_list.length < 1) getFriendRequest();
  }, [data]);

  return {
    friend_request_list,
    accept,
    decline,
  };
}
