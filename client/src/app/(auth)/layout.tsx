import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen w-screen grid place-items-center">
      {children}
    </main>
  );
}
