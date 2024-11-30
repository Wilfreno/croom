import React from "react";
import SidebarContent from "../SidebarContent";
import HomeSearchBar from "./HomeSearchBar";
import HomeActiveFriends from "./HomeActiveFriends";
import HomeConversations from "./HomeConversations";

export default function HomeSideBar() {
  return (
    <SidebarContent className="grid grid-rows-[auto_auto_1fr] gap-4">
      <HomeSearchBar />
      <HomeActiveFriends />
      <HomeConversations />
    </SidebarContent>
  );
}
