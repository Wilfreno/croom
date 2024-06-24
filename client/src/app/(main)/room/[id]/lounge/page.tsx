"use client";

import { redirect, usePathname } from "next/navigation";

export default function page() {
  const pathname = usePathname();

  redirect(pathname + "/text-chat");
}
