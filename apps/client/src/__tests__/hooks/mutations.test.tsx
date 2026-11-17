import { mockConversation, mockMessage, mockUser } from '@/__tests__/mocks/mock-entities';
import { renderHookWithQuery } from '@/__tests__/mocks/render-with-query';
import useComposeMessage from '@/components/hooks/mutation/useComposeMessage.mutation';
import useCreateConversation from '@/components/hooks/mutation/useCreateConversation.mutation';
import useSendMessage from '@/components/hooks/mutation/useSendMessage.mutation';
import { axiosInstance } from '@/lib/axios-instance';
import type { Message, MessagePayload } from '@repo/types';
import type { InfiniteData } from '@tanstack/react-query';
import type { CachedMessage } from '@/types/message.types';
import { act, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { get: vi.fn(), post: vi.fn() } }));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const post = vi.mocked(axiosInstance.post);

type MessagePages = InfiniteData<{ pageParam: number; result: Message[] }, unknown>;

function serverReturns(data: unknown) {
  post.mockResolvedValue({ data: { status: 'OK', message: '', data } });
}

/** What the server sends back for a new message: the conversation comes as `{ id, nicknames }`. */
function payloadFor(conversationId: string, text = 'hi'): MessagePayload {
  const message = mockMessage({ conversation: conversationId, text });
  return { ...message, conversation: { id: conversationId, nicknames: [] } } as MessagePayload;
}

function cachedPages(conversationId: string, pages: Message[][]): MessagePages {
  return {
    pages: pages.map((result, index) => ({ pageParam: index + 1, result })),
    pageParams: pages.map((_, index) => index + 1),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('useSendMessage', () => {
  it('posts the text and photos to the conversation', async () => {
    const conversationId = 'c1';
    serverReturns(payloadFor(conversationId));
    const photo = { key: 'k', url: 'u', width: 1, height: 1 };

    const { result } = renderHookWithQuery(() => useSendMessage(''));
    await act(() => result.current.sendMessage.mutateAsync({ text: 'hi', photoInput: [photo], conversationId }));

    expect(post).toHaveBeenCalledWith('/message', { conversationId, text: 'hi', photos: [photo] });
  });

  it('falls back to the textarea value when no text is passed', async () => {
    serverReturns(payloadFor('c1'));

    const { result } = renderHookWithQuery(() => useSendMessage('typed text'));
    await act(() => result.current.sendMessage.mutateAsync({ text: '', photoInput: [], conversationId: 'c1' }));

    expect(post).toHaveBeenCalledWith('/message', expect.objectContaining({ text: 'typed text' }));
  });

  it('appends the sent message to the last cached page, storing only the conversation id', async () => {
    const conversationId = 'c1';
    const older = mockMessage();
    const recent = mockMessage();
    const payload = payloadFor(conversationId, 'new one');
    serverReturns(payload);

    const { result, queryClient } = renderHookWithQuery(() => useSendMessage(''));
    queryClient.setQueryData(['conversation', 'messages', conversationId], cachedPages(conversationId, [[older], [recent]]));

    await act(() => result.current.sendMessage.mutateAsync({ text: 'new one', photoInput: [], conversationId }));

    const cache = queryClient.getQueryData<MessagePages>(['conversation', 'messages', conversationId])!;
    expect(cache.pages[0].result).toEqual([older]);
    expect(cache.pages[1].result).toEqual([recent, { ...payload, conversation: conversationId }]);
  });

  it('shows a muted copy while sending, then swaps in the saved message under the same key', async () => {
    const conversationId = 'c1';
    const me = mockUser();
    const recent = mockMessage();
    const payload = payloadFor(conversationId, 'new one');
    let respond!: (value: unknown) => void;
    post.mockReturnValue(new Promise((resolve) => (respond = resolve)));

    const { result, queryClient } = renderHookWithQuery(() => useSendMessage(''));
    queryClient.setQueryDefaults(['conversation', 'messages'], { gcTime: Infinity });
    queryClient.setQueryDefaults(['user', 'session'], { gcTime: Infinity });
    queryClient.setQueryData(['user', 'session'], me);
    queryClient.setQueryData(['conversation', 'messages', conversationId], cachedPages(conversationId, [[recent]]));
    const messages = () =>
      queryClient.getQueryData<MessagePages>(['conversation', 'messages', conversationId])!.pages[0].result as CachedMessage[];

    act(() => result.current.sendMessage.mutate({ text: 'new one', photoInput: [], conversationId }));

    await waitFor(() => expect(messages()).toHaveLength(2));
    const pending = messages()[1];
    expect(pending).toMatchObject({ pending: true, text: 'new one', sender: me, conversation: conversationId });

    await act(async () => respond({ data: { status: 'OK', message: '', data: payload } }));

    await waitFor(() => expect(messages()[1].pending).toBeUndefined());
    expect(messages()).toEqual([recent, { ...payload, conversation: conversationId, clientKey: pending.clientKey }]);
  });

  it('keeps the muted copy and marks it failed when sending fails', async () => {
    const conversationId = 'c1';
    const recent = mockMessage();
    post.mockRejectedValue(new Error('network'));

    const { result, queryClient } = renderHookWithQuery(() => useSendMessage(''));
    queryClient.setQueryDefaults(['conversation', 'messages'], { gcTime: Infinity });
    queryClient.setQueryDefaults(['user', 'session'], { gcTime: Infinity });
    queryClient.setQueryData(['user', 'session'], mockUser());
    queryClient.setQueryData(['conversation', 'messages', conversationId], cachedPages(conversationId, [[recent]]));

    act(() => result.current.sendMessage.mutate({ text: 'x', photoInput: [], conversationId }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    const [kept, failed] = queryClient.getQueryData<MessagePages>(['conversation', 'messages', conversationId])!.pages[0]
      .result as CachedMessage[];
    expect(kept).toEqual(recent);
    expect(failed).toMatchObject({ text: 'x', pending: false, failed: true });
  });

  it('replaces a failed message with a new muted copy at the bottom when retrying', async () => {
    const conversationId = 'c1';
    const failed = { ...mockMessage({ text: 'lost' }), failed: true };
    const later = mockMessage({ text: 'later' });
    post.mockReturnValue(new Promise(() => {}));

    const { result, queryClient } = renderHookWithQuery(() => useSendMessage(''));
    queryClient.setQueryDefaults(['conversation', 'messages'], { gcTime: Infinity });
    queryClient.setQueryDefaults(['user', 'session'], { gcTime: Infinity });
    queryClient.setQueryData(['user', 'session'], mockUser());
    queryClient.setQueryData(['conversation', 'messages', conversationId], cachedPages(conversationId, [[failed, later]]));

    act(() =>
      result.current.sendMessage.mutate({ text: 'lost', photoInput: [], conversationId, retryId: failed.id }),
    );

    await waitFor(() => {
      const messages = queryClient.getQueryData<MessagePages>(['conversation', 'messages', conversationId])!.pages[0]
        .result as CachedMessage[];
      expect(messages.map(({ text }) => text)).toEqual(['later', 'lost']);
      expect(messages[1]).toMatchObject({ pending: true });
      expect(messages[1].failed).toBeUndefined();
    });
  });

  it('leaves the cache alone when the conversation was never loaded', async () => {
    serverReturns(payloadFor('c1'));

    const { result, queryClient } = renderHookWithQuery(() => useSendMessage(''));
    await act(() => result.current.sendMessage.mutateAsync({ text: 'x', photoInput: [], conversationId: 'c1' }));

    expect(queryClient.getQueryData(['conversation', 'messages', 'c1'])).toBeUndefined();
  });

  it('surfaces a failed send', async () => {
    post.mockRejectedValue(new Error('network'));

    const { result } = renderHookWithQuery(() => useSendMessage(''));
    act(() => result.current.sendMessage.mutate({ text: 'x', photoInput: [], conversationId: 'c1' }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
  });

  it('refreshes the conversation when the send is refused because you were blocked', async () => {
    post.mockRejectedValue(
      new AxiosError('423', undefined, undefined, undefined, {
        status: 423,
        data: { status: 'BLOCKED', message: 'you are blocked in this conversation', data: null },
      } as never),
    );

    const { result, queryClient } = renderHookWithQuery(() => useSendMessage(''));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    act(() => result.current.sendMessage.mutate({ text: 'x', photoInput: [], conversationId: 'c1' }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['conversation', 'c1'] });
  });

  it('does not refresh the conversation for other failures', async () => {
    post.mockRejectedValue(new Error('network'));

    const { result, queryClient } = renderHookWithQuery(() => useSendMessage(''));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    act(() => result.current.sendMessage.mutate({ text: 'x', photoInput: [], conversationId: 'c1' }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useComposeMessage', () => {
  it('posts the message with the members for a first message', async () => {
    const payload = payloadFor('new-conversation');
    serverReturns(payload);
    const photos = [{ key: 'k', url: 'u', width: 1, height: 1 }];

    const { result } = renderHookWithQuery(() => useComposeMessage());
    await act(() => result.current.sendMessage.mutateAsync({ conversationId: '', text: 'hi', members: ['u1'], photos }));

    expect(post).toHaveBeenCalledWith('/message', { text: 'hi', photos, members: ['u1'] });
  });

  it('posts only the conversation, not the members, into a conversation that already exists', async () => {
    serverReturns(payloadFor('c1'));

    const { result } = renderHookWithQuery(() => useComposeMessage());
    await act(() => result.current.sendMessage.mutateAsync({ conversationId: 'c1', text: 'hi', members: ['u1'], photos: [] }));

    expect(post).toHaveBeenCalledWith('/message', { conversationId: 'c1', text: 'hi', photos: [] });
  });

  it('navigates to the conversation the server created', async () => {
    serverReturns(payloadFor('new-conversation'));

    const { result } = renderHookWithQuery(() => useComposeMessage());
    await act(() => result.current.sendMessage.mutateAsync({ conversationId: '', text: 'hi', members: ['u1'], photos: [] }));

    expect(push).toHaveBeenCalledWith('/conversation/new-conversation');
  });

  it('navigates to the existing conversation and appends to its cache', async () => {
    const existing = mockMessage();
    const payload = payloadFor('c1');
    serverReturns(payload);

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage());
    queryClient.setQueryData(['conversation', 'messages', 'c1'], cachedPages('c1', [[existing]]));
    await act(() => result.current.sendMessage.mutateAsync({ conversationId: 'c1', text: 'hi', members: [], photos: [] }));

    expect(push).toHaveBeenCalledWith('/conversation/c1');
    const cache = queryClient.getQueryData<MessagePages>(['conversation', 'messages', 'c1'])!;
    expect(cache.pages[0].result).toEqual([existing, { ...payload, conversation: 'c1' }]);
  });

  it('does not navigate when sending fails', async () => {
    post.mockRejectedValue(new Error('network'));

    const { result } = renderHookWithQuery(() => useComposeMessage());
    act(() => result.current.sendMessage.mutate({ conversationId: 'c1', text: 'hi', members: [], photos: [] }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    expect(push).not.toHaveBeenCalled();
  });

  it('refreshes the conversation when the send is refused because it is blocked', async () => {
    post.mockRejectedValue(
      new AxiosError('423', undefined, undefined, undefined, {
        status: 423,
        data: { status: 'BLOCKED', message: 'this conversation is blocked', data: null },
      } as never),
    );

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    act(() => result.current.sendMessage.mutate({ conversationId: 'c1', text: 'hi', members: [], photos: [] }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['conversation', 'c1'] });
  });

  it('does not refresh the conversation for other failures', async () => {
    post.mockRejectedValue(new Error('network'));

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    act(() => result.current.sendMessage.mutate({ conversationId: 'c1', text: 'hi', members: [], photos: [] }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('shows a muted copy in the existing conversation while sending', async () => {
    const existing = mockMessage();
    const me = mockUser();
    let respond!: (value: unknown) => void;
    post.mockReturnValue(new Promise((resolve) => (respond = resolve)));

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage());
    queryClient.setQueryDefaults(['conversation', 'messages'], { gcTime: Infinity });
    queryClient.setQueryDefaults(['user', 'session'], { gcTime: Infinity });
    queryClient.setQueryData(['user', 'session'], me);
    queryClient.setQueryData(['conversation', 'messages', 'c1'], cachedPages('c1', [[existing]]));
    const messages = () =>
      queryClient.getQueryData<MessagePages>(['conversation', 'messages', 'c1'])!.pages[0].result as CachedMessage[];

    act(() => result.current.sendMessage.mutate({ conversationId: 'c1', text: 'hi', members: [], photos: [] }));

    await waitFor(() => expect(messages()).toHaveLength(2));
    expect(messages()[1]).toMatchObject({ pending: true, text: 'hi', sender: me });

    const payload = payloadFor('c1');
    await act(async () => respond({ data: { status: 'OK', message: '', data: payload } }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/conversation/c1'));
    expect(messages()[1]).toEqual({ ...payload, conversation: 'c1', clientKey: expect.stringMatching(/^pending-/) });
  });

  it('shows a muted copy for a first message, then clears it once the conversation exists', async () => {
    let respond!: (value: unknown) => void;
    post.mockReturnValue(new Promise((resolve) => (respond = resolve)));

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage());
    queryClient.setQueryDefaults(['conversation', 'messages'], { gcTime: Infinity });
    queryClient.setQueryDefaults(['user', 'session'], { gcTime: Infinity });
    queryClient.setQueryData(['user', 'session'], mockUser());
    const draftKey = ['conversation', 'messages', undefined];

    act(() => result.current.sendMessage.mutate({ text: 'hi', members: ['u1'], photos: [] }));

    await waitFor(() =>
      expect(queryClient.getQueryData<MessagePages>(draftKey)?.pages[0].result).toEqual([
        expect.objectContaining({ pending: true, text: 'hi' }),
      ]),
    );

    await act(async () => respond({ data: { status: 'OK', message: '', data: payloadFor('new-conversation') } }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/conversation/new-conversation'));
    expect(queryClient.getQueryData(draftKey)).toBeUndefined();
  });

  it('replaces a failed first message with a new muted copy when retrying', async () => {
    const failed = { ...mockMessage({ text: 'lost' }), failed: true };
    post.mockReturnValue(new Promise(() => {}));

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage());
    queryClient.setQueryDefaults(['conversation', 'messages'], { gcTime: Infinity });
    queryClient.setQueryDefaults(['user', 'session'], { gcTime: Infinity });
    queryClient.setQueryData(['user', 'session'], mockUser());
    const draftKey = ['conversation', 'messages', undefined];
    queryClient.setQueryData(draftKey, cachedPages('', [[failed]]));

    act(() => result.current.sendMessage.mutate({ text: 'lost', members: ['u1'], photos: [], retryId: failed.id }));

    await waitFor(() =>
      expect(queryClient.getQueryData<MessagePages>(draftKey)!.pages[0].result).toEqual([
        expect.objectContaining({ text: 'lost', pending: true }),
      ]),
    );
  });

  it('keeps the muted copy of a first message and marks it failed when sending fails', async () => {
    post.mockRejectedValue(new Error('network'));

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage());
    queryClient.setQueryDefaults(['conversation', 'messages'], { gcTime: Infinity });
    queryClient.setQueryDefaults(['user', 'session'], { gcTime: Infinity });
    queryClient.setQueryData(['user', 'session'], mockUser());

    act(() => result.current.sendMessage.mutate({ text: 'hi', members: ['u1'], photos: [] }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    expect(queryClient.getQueryData<MessagePages>(['conversation', 'messages', undefined])!.pages[0].result).toEqual([
      expect.objectContaining({ text: 'hi', pending: false, failed: true }),
    ]);
    expect(push).not.toHaveBeenCalled();
  });
});

describe('useCreateConversation', () => {
  it('creates the conversation, then sends the first message into it', async () => {
    const conversation = mockConversation();
    post
      .mockResolvedValueOnce({ data: { status: 'OK', message: '', data: conversation } })
      .mockResolvedValueOnce({ data: { status: 'OK', message: '', data: payloadFor(conversation.id) } });

    const { result } = renderHookWithQuery(() => useCreateConversation({ photos: [], members: ['u1', 'u2'] }));
    await act(() => result.current.createNewConversation.mutateAsync({ text: 'hello' }));

    expect(post).toHaveBeenNthCalledWith(1, '/conversation', { members: ['u1', 'u2'] });
    await waitFor(() =>
      expect(post).toHaveBeenNthCalledWith(2, '/message', {
        conversationId: conversation.id,
        text: 'hello',
        photos: [],
      }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith(`/conversation/${conversation.id}`));
  });

  it('sends no message when the conversation could not be created', async () => {
    post.mockRejectedValue(new Error('network'));

    const { result } = renderHookWithQuery(() => useCreateConversation({ photos: [], members: ['u1'] }));
    act(() => result.current.createNewConversation.mutate({ text: 'hello' }));

    await waitFor(() => expect(result.current.createNewConversation.isError).toBe(true));
    expect(post).toHaveBeenCalledTimes(1);
  });
});
