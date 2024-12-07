"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function useURLSearchParams() {
  const search_params = useSearchParams();

  const url_search_params = useMemo(() => {
    const url = new URL(window.location.href);
    return new URLSearchParams(url.search);
  }, [search_params]);

  return { url_search_params };
}
