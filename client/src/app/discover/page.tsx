"use client";

import { usePathname } from "next/navigation";

export default function page() {
  const path_name = usePathname();
  return <div>{path_name}</div>;
}
