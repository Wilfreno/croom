import MainSideBar from "@/components/page/main/sidebar/MainSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full h-dvh max-h-dvh flex bg-secondary">
      <MainSideBar />
      {children}
    </main>
  );
}
