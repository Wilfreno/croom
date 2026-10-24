import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

export default function MockQueryClientProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** A client that does not retry, so a rejected query settles inside one tick. */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}
