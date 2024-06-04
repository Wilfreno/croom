"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import { useToast } from "@/components/ui/use-toast";
import { ServerResponse } from "@/lib/types/sever-response";
import { FriendRequest } from "@/lib/types/client-types";
import {
  FriendRequestMessageType,
  WebSocketSeverMessage,
  WebsocketClientMessage,
} from "@/lib/types/websocket-type";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { useDispatch } from "react-redux";
import { setNewFriendRequestList } from "@/lib/redux/slices/friend-requests-slice";
import { NotificationType } from "@/lib/types/notification-type";
import useServerUrl from "./useServerUrl";

export default function useFriendRequestHandler() {
  const server_url = useServerUrl();
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
      server_url + "/v1/get/friend-request/" + data?.user.id
    );

    const response_json = (await response.json()) as ServerResponse;
    const friend_requests = response_json.data as FriendRequestMessageType[];
    if (response_json.status === "OK")
      dispatch(
        setNewFriendRequestList(
          friend_requests.map((request) => ({
            sender: request.sender,
            receiver: request.receiver,
            date_created: request.date_created,
          }))
        )
      );
  }

  async function accept(
    sender: FriendRequestMessageType["sender"],
    index: number
  ) {
    const response = await fetch(server_url + "/v1/accept/friend-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: sender.id,
        receiver: data?.user.id,
      }),
    });
    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status === "OK") {
      websocket?.send(
        JSON.stringify({
          type: "accept-friend-request",
          payload: {
            sender: sender,
            receiver: data?.user,
          },
        } as WebsocketClientMessage)
      );
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

  async function decline(
    sender: FriendRequestMessageType["sender"],
    index: number
  ) {
    const response = await fetch(server_url + "/v1/decline/friend-request", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: sender.id,
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

      if (message.type === "send-friend-request") {
        const payload = message.payload as FriendRequestMessageType;
        dispatch(setNewFriendRequestList([...friend_request_list, payload]));
      }
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
