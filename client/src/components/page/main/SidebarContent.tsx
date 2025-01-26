import { cn } from "@/lib/utils";
import React from "react";

export default function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "inset-y-0 max-h-dvh md:w-96 border shadow md:rounded-md bg-background p-2",
        className
      )}
    >
      {children}
    </section>
  );
}
