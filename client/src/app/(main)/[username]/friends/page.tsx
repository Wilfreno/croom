"use client";
import { redirect, usePathname } from "next/navigation";

export default function page() {
  const path_name = usePathname();
  redirect(path_name + "/online");
}
