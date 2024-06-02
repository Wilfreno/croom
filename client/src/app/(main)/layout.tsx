"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import LayoutSideBar from "@/components/layout/LayoutSideBar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import React, { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  if (data?.user.provider) redirect("/new");

  console.log("session:", data);

  const websocket = useWebsocket();

  useEffect(() => {
    return () => websocket?.close();
  }, []);

  return (
    <>
      <LayoutSideBar />
      {children}
    </>
  );
}
