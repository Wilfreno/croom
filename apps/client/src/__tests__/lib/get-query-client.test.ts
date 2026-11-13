import { describe, expect, it, vi } from 'vitest';

async function load(isServer: boolean) {
  vi.resetModules();
  vi.doMock('@tanstack/react-query', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@tanstack/react-query')>()),
    isServer,
  }));
  return (await import('@/lib/react-query/get-query-client')).getQueryClient;
}

describe('getQueryClient', () => {
  it('reuses one client in the browser', async () => {
    const getQueryClient = await load(false);

    expect(getQueryClient()).toBe(getQueryClient());
  });

  it('makes a fresh client per call on the server, so requests never share a cache', async () => {
    const getQueryClient = await load(true);

    expect(getQueryClient()).not.toBe(getQueryClient());
  });

  it('keeps queries fresh for five minutes', async () => {
    const getQueryClient = await load(false);

    expect(getQueryClient().getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
  });
});
