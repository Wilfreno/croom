"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import LayoutSideBar from "@/components/layout/LayoutSideBar";
import NewUser from "@/components/page/new-user/NewUser";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const websocket = useWebsocket(data?.user.id!);

  useEffect(() => {
    websocket?.addEventListener("open", () => websocket?.send("wee"));
  }, []);

  return (
    <>
      <NewUser />
      <LayoutSideBar />
      {children}
    </>
  );
}
