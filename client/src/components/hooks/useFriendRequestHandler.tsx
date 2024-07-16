"use client";
import { WebsocketFriendRequestType } from "@/lib/types/websocket-type";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { useDispatch } from "react-redux";
import { FriendRequest } from "@/lib/types/client-types";
import { useWebsocket } from "./useWebsocket";
import useHTTPRequest from "./useHTTPRequest";
import websocketMessage from "@/lib/websocket-message";
import { setWSFriendRequest } from "@/lib/redux/slices/ws-friend-request-slice";
import { useRouter } from "next/navigation";

export default function useFriendRequestHandler() {
  const [friend_request_list, setFriendRequestList] = useState<FriendRequest[]>(
    []
  );

  const ws_friend_request = useAppSelector((state) => state.ws_friend_request);
  const dispatch = useDispatch<AppDispatch>();
  const { data } = useSession();
  const websocket = useWebsocket();
  const http_request = useHTTPRequest();
  const router = useRouter();

  async function getFriendRequest() {
    try {
      const friend_requests = (await http_request.GET(
        "/v1/user/" + data!.user.id + "/friend-request/received"
      )) as FriendRequest[];

      setFriendRequestList(friend_requests);
    } catch (error) {
      throw error;
    }
  }

  async function accept(sender: FriendRequest["sender"]) {
    try {
      await http_request.POST("/v1/friend-request/accept", {
        sender_id: sender!.id,
        receiver_id: data?.user.id,
      });
      const payload = {
        sender_id: sender!.id,
        receiver_id: data!.user.id,
      } as WebsocketFriendRequestType;

      websocket?.send(websocketMessage("accept-friend-request", payload));

      setTimeout(() => {
        setFriendRequestList((prev) =>
          prev.filter(
            (friend_request) => friend_request.sender!.id !== sender!.id
          )
        );
      }, 1000);
    } catch (error) {
      throw error;
    }
  }

  async function decline(sender: FriendRequest["sender"]) {
    try {
      await http_request.DELETE("/v1/friend-request/decline", {
        sender_id: sender!.id,
        receiver_id: data!.user.id,
      });
      setTimeout(() => {
        setFriendRequestList((prev) =>
          prev.filter(
            (friend_request) => friend_request.sender!.id !== sender!.id
          )
        );
      }, 1000); 
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    if (!data) return;

    getFriendRequest();
  }, [data]);

  useEffect(() => {
    if (!ws_friend_request) return;

    setFriendRequestList((prev) => [...prev, ws_friend_request]);
  }, [ws_friend_request]);

  return {
    friend_request_list,
    accept,
    decline,
  };
}
