"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import LayoutSideBar from "@/components/layout/LayoutSideBar";
import React, { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const websocket = useWebsocket();

  useEffect(() => {
    return () => websocket?.close();
  }, [websocket]);

  return (
    <>
      <LayoutSideBar />
      {children}
    </>
  );
}
