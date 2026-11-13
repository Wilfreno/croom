import { mockConversation, mockMessage } from '@/__tests__/mocks/mock-entities';
import { renderHookWithQuery } from '@/__tests__/mocks/render-with-query';
import useComposeMessage from '@/components/hooks/mutation/useComposeMessage.mutation';
import useCreateConversation from '@/components/hooks/mutation/useCreateConversation.mutation';
import useSendMessage from '@/components/hooks/mutation/useSendMessage.mutation';
import { axiosInstance } from '@/lib/axios-instance';
import type { Message, MessagePayload } from '@repo/types';
import type { InfiniteData } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
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
});

describe('useComposeMessage', () => {
  it('posts the message with the members for a first message', async () => {
    const payload = payloadFor('new-conversation');
    serverReturns(payload);
    const photos = [{ url: 'u' }];

    const { result } = renderHookWithQuery(() => useComposeMessage({ photos }));
    await act(() => result.current.sendMessage.mutateAsync({ conversationId: '', text: 'hi', members: ['u1'] }));

    expect(post).toHaveBeenCalledWith('/message', { conversationId: '', text: 'hi', photos, members: ['u1'] });
  });

  it('navigates to the conversation the server created', async () => {
    serverReturns(payloadFor('new-conversation'));

    const { result } = renderHookWithQuery(() => useComposeMessage({ photos: [] }));
    await act(() => result.current.sendMessage.mutateAsync({ conversationId: '', text: 'hi', members: ['u1'] }));

    expect(push).toHaveBeenCalledWith('/conversation/new-conversation');
  });

  it('navigates to the existing conversation and appends to its cache', async () => {
    const existing = mockMessage();
    const payload = payloadFor('c1');
    serverReturns(payload);

    const { result, queryClient } = renderHookWithQuery(() => useComposeMessage({ photos: [] }));
    queryClient.setQueryData(['conversation', 'messages', 'c1'], cachedPages('c1', [[existing]]));
    await act(() => result.current.sendMessage.mutateAsync({ conversationId: 'c1', text: 'hi', members: [] }));

    expect(push).toHaveBeenCalledWith('/conversation/c1');
    const cache = queryClient.getQueryData<MessagePages>(['conversation', 'messages', 'c1'])!;
    expect(cache.pages[0].result).toEqual([existing, { ...payload, conversation: 'c1' }]);
  });

  it('does not navigate when sending fails', async () => {
    post.mockRejectedValue(new Error('network'));

    const { result } = renderHookWithQuery(() => useComposeMessage({ photos: [] }));
    act(() => result.current.sendMessage.mutate({ conversationId: 'c1', text: 'hi', members: [] }));

    await waitFor(() => expect(result.current.sendMessage.isError).toBe(true));
    expect(push).not.toHaveBeenCalled();
  });
});

describe('useCreateConversation', () => {
  it('creates the conversation, then sends the first message into it with the members', async () => {
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
        members: ['u1', 'u2'],
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
