"use client";

import { setFriendRequestList } from "@/lib/redux/slices/friend-requests-slice";
import { setOnlineFriends } from "@/lib/redux/slices/online-friends-slice";
import { AppDispatch } from "@/lib/redux/store";
import {
  WebSocketSeverMessage,
  WebsocketFriendRequestType,
  WebsocketUserType,
} from "@/lib/types/websocket-type";
import { useSession } from "next-auth/react";
import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

let websocket_instance: WebSocket | null = null;

export function useWebsocketInstance() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_WEBSOCKET_SERVER is missing from your .env.local file"
    );
  const { data } = useSession();

  const websocket_ref = useRef<WebSocket>();

  useEffect(() => {
    if (!data) return;
    if (!websocket_instance)
      websocket_instance = new WebSocket(
        server_url + "?user_id=" + data?.user.id
      );
    websocket_ref.current = websocket_instance;
  }, [data]);

  return websocket_ref.current;
}

export default function WebsocketMessageHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const websocket = useWebsocketInstance();
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
