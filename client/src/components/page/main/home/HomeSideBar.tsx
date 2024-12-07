import React from "react";
import SidebarContent from "../SidebarContent";
import HomeActiveFriends from "./HomeActiveFriends";
import HomeConversations from "./HomeConversations";

export default function HomeSideBar() {
  return (
    <SidebarContent className="grid grid-rows-[auto_auto_1fr] gap-4 py-5">
      <HomeActiveFriends />
      <HomeConversations />
    </SidebarContent>
  );
}
