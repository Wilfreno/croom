import LayoutSideBar from "@/components/layout/LayoutSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LayoutSideBar />
      {children}
    </>
  );
}
