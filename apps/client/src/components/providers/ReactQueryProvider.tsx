"use client";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const query_client = getQueryClient();
  return <QueryClientProvider client={query_client}>{children}</QueryClientProvider>;
}
