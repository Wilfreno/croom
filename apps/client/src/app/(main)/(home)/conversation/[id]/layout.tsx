import InfoSidebar from "@/components/page/main/info/InfoSidebar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InfoSidebar />
    </>
  );
}
