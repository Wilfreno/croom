import Aside from "@/components/page/main/aside/Aside";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full h-dvh max-h-dvh flex bg-secondary">
      <Aside />
      {children}
    </main>
  );
}
