import ConversationSideBar from "@/components/page/main/SideBar/ConversationSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-0 min-w-0 p-1 gap-1">
      <ConversationSideBar />
      {children}
    </div>
  );
}
