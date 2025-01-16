import { cn } from "@/lib/utils";
import React from "react";

export default function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
<<<<<<< HEAD
    <section className={cn("inset-y-0 w-96 border shadow rounded-md bg-background p-2", className)}>{children}</section>
=======
    <section className={cn("inset-y-0 w-[22rem] border shadow rounded-md bg-background p-2", className)}>{children}</section>
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  );
}
