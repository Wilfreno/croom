import LandingPageHeader from "@/components/page/landing/LandingPageHeader";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-screen h-dvh grid grid-rows-[auto_1fr]">
      <LandingPageHeader />
      {children}
    </section>
  );
}
