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
    websocket?.addEventListener("message", (socket) => {
      const message = JSON.parse(socket.data) as WebSocketSeverMessage;

      const payload = message.payload as WebsocketUserType;
      if (message.type === "online-friend") {
        dispatch(setOnlineFriends({ operation: "add", content: payload }));
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
