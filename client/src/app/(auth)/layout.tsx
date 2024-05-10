import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen w-screen grid grid-cols-[1fr_auto]">
      <section></section>
      {children}
    </main>
  );
}
