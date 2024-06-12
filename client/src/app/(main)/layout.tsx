"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import LayoutSideBar from "@/components/layout/LayoutSideBar";
import { setOnlineFriends } from "@/lib/redux/slices/online-friends-slice";
import { AppDispatch } from "@/lib/redux/store";
import {
  WebSocketSeverMessage,
  WebsocketUserType,
} from "@/lib/types/websocket-type";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function Layout({ children }: { children: React.ReactNode }) {
  const websocket = useWebsocket();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    websocket?.addEventListener("message", (websocket_message) => {
      const message = JSON.parse(
        websocket_message.data
      ) as WebSocketSeverMessage;

      const payload = message.payload as WebsocketUserType;
      switch (message.type) {
        case "online-friend":
          dispatch(setOnlineFriends({ operation: "add", content: payload }));
          break;
        case "offline":
          dispatch(setOnlineFriends({ operation: "remove", content: payload }));
          break;
        default:
          return;
      }
    });

    return () => websocket?.close();
  }, [websocket]);

  return (
    <>
      <LayoutSideBar />
      {children}
    </>
  );
}
