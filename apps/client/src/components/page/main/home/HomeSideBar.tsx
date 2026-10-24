"use client";
import React from "react";
import SidebarContent from "../SidebarContent";
import HomeActiveFriends from "./HomeActiveConversation";
import HomeConversations from "./HomeConversations";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import useUserAgent from "@/components/hooks/useUserAgent";
import HomeSideBarMobileHeader from "./HomeSideBarMobileHeader";

export default function HomeSideBar() {
  const { data: open } = useQuery({ queryKey: ["home", "sidebar"], queryFn: () => true });
  const { onMobile: isMobile } = useUserAgent();
  const pathname = usePathname();

  if (isMobile && pathname !== "/") return null;
  return (
    <SidebarContent
      className={cn(
        open
          ? "grid grid-rows-[auto_auto_1fr] gap-4 pt-4 md:grid-rows-[auto_1fr] md:gap-4 md:py-5"
          : "hidden"
      )}
    >
      <HomeSideBarMobileHeader />
      <HomeActiveFriends />
      <HomeConversations />
    </SidebarContent>
  );
}
