"use client";
import { getQueryClient } from "@/lib/react-query/get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const query_client = getQueryClient();
  return (
    <QueryClientProvider client={query_client}>
      {children}
<<<<<<< HEAD
      {/* <ReactQueryDevtools /> */}
=======
      <ReactQueryDevtools />
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
    </QueryClientProvider>
  );
}
