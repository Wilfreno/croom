import { cn } from "@/lib/utils";
import React from "react";

export default function MainContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grow md:rounded-lg bg-background border shadow", className)}>
      {children}
    </section>
  );
}
