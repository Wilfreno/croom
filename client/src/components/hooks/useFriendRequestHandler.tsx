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
import { setNotification } from "@/lib/redux/slices/notification-slice";

export default function useFriendRequestHandler() {
  const [friend_request_list, setFriendRequestList] = useState<FriendRequest[]>(
    []
  );

  const notifications = useAppSelector((state) => state.notification_reducer);

  const dispatch = useDispatch<AppDispatch>();
  const { data } = useSession();
  const websocket = useWebsocket();
  const http_request = useHTTPRequest();

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
          prev.filter((fr) => fr.sender_id !== sender!.id)
        );
        dispatch(
          setNotification({
            operation: "remove",
            notification: notifications.find(
              (nt) => nt.friend_request?.sender_id === sender!.id
            )!,
          })
        );
      }, 3000);
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
        setTimeout(() => {
          setFriendRequestList((prev) =>
            prev.filter((fr) => fr.sender_id !== sender!.id)
          );
          dispatch(
            setNotification({
              operation: "remove",
              notification: notifications.find(
                (nt) => nt.friend_request?.sender_id === sender!.id
              )!,
            })
          );
        }, 3000);
      }, 3000);
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    if (!data) return;

    getFriendRequest();
  }, [data]);

  useEffect(() => {
    if (notifications.length < 1) return;

    setFriendRequestList((prev) => [
      ...prev,
      ...notifications
        .filter((n) => n.type === "FRIEND_REQUEST")
        .map((n) => n.friend_request!)!,
    ]);
  }, [notifications]);

  return {
    friend_request_list,
    accept,
    decline,
  };
}
