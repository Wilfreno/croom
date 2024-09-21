import MainSideBar from "@/components/page/main/MainSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <MainSideBar />
    </section>
  );
}
