import { DELETERequest, GETRequest, PATCHRequest, POSTRequest } from '@/lib/server/requests';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SERVER = process.env.NEXT_PUBLIC_SERVER;
const reply = { status: 'OK', message: 'done', data: { id: '1' } };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ json: async () => reply });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('path validation', () => {
  it.each([
    ['POSTRequest', POSTRequest],
    ['GETRequest', GETRequest],
    ['PATCHRequest', PATCHRequest],
    ['DELETERequest', DELETERequest],
  ])('%s rejects a path without a leading slash', async (_, request) => {
    await expect(request('v1/user')).rejects.toThrow('path must start with /');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('POSTRequest', () => {
  it('sends a JSON body with credentials and returns the parsed reply', async () => {
    await expect(POSTRequest('/v1/user', { id: 1 })).resolves.toEqual(reply);

    expect(fetchMock).toHaveBeenCalledWith(SERVER + '/v1/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1 }),
      credentials: 'include',
    });
  });

  it('sends no body or content type when there is no body', async () => {
    await POSTRequest('/v1/logout');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeUndefined();
  });
});

describe('GETRequest', () => {
  it('requests the path with credentials', async () => {
    await expect(GETRequest('/v1/user')).resolves.toEqual(reply);

    expect(fetchMock).toHaveBeenCalledWith(SERVER + '/v1/user', expect.objectContaining({ method: 'GET', credentials: 'include' }));
  });

  it('appends encoded query parameters', async () => {
    await GETRequest('/v1/search', { q: 'a b', page: '2' });

    expect(fetchMock.mock.calls[0][0]).toBe(SERVER + '/v1/search?q=a+b&page=2');
  });
});

describe('PATCHRequest', () => {
  it('sends a JSON body with the PATCH method', async () => {
    await PATCHRequest('/v1/user/userName', { userName: '@me' });

    expect(fetchMock).toHaveBeenCalledWith(SERVER + '/v1/user/userName', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName: '@me' }),
      credentials: 'include',
    });
  });
});

describe('DELETERequest', () => {
  it('sends a JSON body with the DELETE method', async () => {
    await DELETERequest('/v1/block', { id: 'b1' });

    expect(fetchMock).toHaveBeenCalledWith(SERVER + '/v1/block', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'b1' }),
      credentials: 'include',
    });
  });
});

describe('failures', () => {
  it('rejects when the network request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(GETRequest('/v1/user')).rejects.toThrow('Failed to fetch');
  });

  it('rejects when the reply is not JSON', async () => {
    fetchMock.mockResolvedValue({
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });

    await expect(POSTRequest('/v1/user', {})).rejects.toThrow(SyntaxError);
  });
});
