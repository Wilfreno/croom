"use client";
import { redirect, usePathname } from "next/navigation";

export default function Page() {
  const path_name = usePathname();
  redirect(path_name + "/online");
}
