import React from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="grow flex flex-col gap-16 items-center p-10">
      <header className="text-2xl font-semibold text-primary">Recover your account</header>
      {children}
    </section>
  );
}
