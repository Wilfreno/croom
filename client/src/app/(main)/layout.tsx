import WebsocketMessageHandler from "@/components/WebsocketMessageHandler";
import LayoutSideBar from "@/components/layout/LayoutSideBar";
import React, { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
      <WebsocketMessageHandler>
        <LayoutSideBar />
        {children}
      </WebsocketMessageHandler>
  );
}
