"use client";

import { setFriendRequestList } from "@/lib/redux/slices/friend-requests-slice";
import { setOnlineFriends } from "@/lib/redux/slices/online-friends-slice";
import { AppDispatch } from "@/lib/redux/store";
import {
  WebSocketSeverMessage,
  WebsocketFriendRequestType,
  WebsocketUserType,
} from "@/lib/types/websocket-type";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useWebsocket } from "./hooks/useWebsocket";

export default function WebsocketMessageHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const websocket = useWebsocket();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    websocket?.addEventListener("message", (websocket_message) => {
      const message = JSON.parse(
        websocket_message.data
      ) as WebSocketSeverMessage;

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
        case "send-friend-request": {
          const payload = message.payload as WebsocketFriendRequestType;
          dispatch(
            setFriendRequestList({ operation: "add", content: payload })
          );

          break;
        }
        default:
          return;
      }
    });

    return () => websocket?.close();
  }, [websocket]);

  return children;
}
