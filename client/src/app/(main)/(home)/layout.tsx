import HomeSideBar from "@/components/page/main/home/HomeSideBar";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <section className="w-full h-dvh max-h-dvh flex gap-2 p-2 bg-secondary">
=======
    <section className="w-full h-dvh max-h-dvh flex gap-4 p-4 bg-secondary">
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      <HomeSideBar />
      {children}
    </section>
  );
}
