import HomeSideBar from "@/components/page/main/home/HomeSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full h-full flex md:gap-2 md:p-2 md:pl-16">
      <HomeSideBar />
      {children}
    </section>
  );
}
