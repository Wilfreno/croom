"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function useURLSearchParams() {
  const searchParams = useSearchParams();

  const urlSearchParams = useMemo(() => {
    const url = new URL(window.location.href);
    return new URLSearchParams(url.search);
  }, [searchParams]);

  return { urlSearchParams };
}
