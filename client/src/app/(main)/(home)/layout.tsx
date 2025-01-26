import HomeSideBar from "@/components/page/main/home/HomeSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full h-dvh max-h-dvh md:flex md:gap-2 md:p-2 bg-secondary">
      <HomeSideBar />
      {children}
    </section>
  );
}
