"use client";

import { usePathname } from "next/navigation";

export default function Page() {
  const path_name = usePathname();
  return <div>{path_name}</div>;
}
