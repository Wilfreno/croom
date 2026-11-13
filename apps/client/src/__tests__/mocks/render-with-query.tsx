import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, type RenderHookOptions } from '@testing-library/react';
import React from 'react';
import { makeQueryClient } from './MockQueryClientProvider';

/** `renderHook` inside a fresh, non-retrying QueryClient, which is returned for cache assertions. */
export function renderHookWithQuery<Result, Props>(
  hook: (props: Props) => Result,
  options: Omit<RenderHookOptions<Props>, 'wrapper'> & { queryClient?: QueryClient } = {},
) {
  const queryClient = options.queryClient ?? makeQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(hook, { ...options, wrapper }) };
}

/** `render` inside a fresh, non-retrying QueryClient, which is returned for cache assertions. */
export function renderWithQuery(ui: React.ReactElement, queryClient: QueryClient = makeQueryClient()) {
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}
