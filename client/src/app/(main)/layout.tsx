import WebsocketMessageHandler from "@/components/Websocket";
import LayoutSideBar from "@/components/layout/LayoutSideBar";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WebsocketMessageHandler>
      <LayoutSideBar />
      {children}
    </WebsocketMessageHandler>
  );
}
