import HomeSideBar from "@/components/page/main/home/HomeSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full h-dvh max-h-dvh flex gap-4 p-4 bg-secondary">
      <HomeSideBar />
      {children}
    </section>
  );
}
