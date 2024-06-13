import WebsocketMessageHandler from "@/components/Websocket";
import LayoutSideBar from "@/components/layout/LayoutSideBar";
import React, { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <WebsocketMessageHandler>
        <LayoutSideBar />
        {children}
      </WebsocketMessageHandler>
    </Suspense>
  );
}
