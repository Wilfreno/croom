import { cn } from "@/lib/utils";
import React from "react";

export default function MainContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("inset-y-0 grow rounded-lg bg-background", className)}>{children}</section>;
}
