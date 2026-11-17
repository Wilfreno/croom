import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-10 sm:gap-16 items-center p-6 sm:p-10">
      <header className="text-2xl font-semibold text-primary">Recover your account</header>
      {children}
    </section>
  );
}
