"use client";
import React from "react";
import SidebarContent from "../SidebarContent";
import HomeActiveFriends from "./HomeActiveConversation";
import HomeConversations from "./HomeConversations";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function HomeSideBar() {
  const { data: open } = useQuery({ queryKey: ["home", "sidebar"], queryFn: () => true });

  return (
    <SidebarContent
      className={cn(open ? "grid grid-rows-[auto_auto_1fr] gap-4 py-5" : "hidden")}
    >
      <HomeActiveFriends />
      <HomeConversations />
    </SidebarContent>
  );
}
