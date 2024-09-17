"use client";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const query_client = getQueryClient();
  return (
    <QueryClientProvider client={query_client}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
