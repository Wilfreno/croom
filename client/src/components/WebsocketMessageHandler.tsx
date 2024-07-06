"use client";

import { setOnlineFriends } from "@/lib/redux/slices/online-friends-slice";
import { AppDispatch } from "@/lib/redux/store";
import {
  WebSocketMessage,
  WebsocketUserType,
} from "@/lib/types/websocket-type";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useWebsocket } from "./hooks/useWebsocket";
import { Notification } from "@/lib/types/client-types";
import { setWSFriendRequest } from "@/lib/redux/slices/ws-friend-request-slice";

export default function WebsocketMessageHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const websocket = useWebsocket();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    websocket?.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data) as WebSocketMessage;

      switch (message.type) {
        case "online-friend": {
          const payload = message.payload as WebsocketUserType;
          dispatch(setOnlineFriends({ operation: "add", content: payload }));
          break;
        }
        case "offline": {
          const payload = message.payload as WebsocketUserType;

          dispatch(setOnlineFriends({ operation: "remove", content: payload }));
          break;
        }
        case "notification": {
          const payload = message.payload as Notification;

          switch (payload.type) {
            case "FRIEND_REQUEST":
              dispatch(setWSFriendRequest(payload.friend_request!));
              break;
          }
        }
        default:
          return;
      }
    });

    return () => websocket?.close();
  }, [websocket]);

  return children;
}
