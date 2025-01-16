import Aside from "@/components/page/main/aside/Aside";
import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
<<<<<<< HEAD
    <main className="w-full h-dvh max-h-dvh flex">
=======
    <main className="w-full h-dvh max-h-dvh flex bg-secondary">
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
      <Aside />
      {children}
    </main>
  );
}
