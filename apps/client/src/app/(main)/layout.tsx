import Aside from "@/components/page/main/SideBar/Aside";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh gap-1 overflow-hidden">
      <Aside />
      {children}
    </main>
  );
}
