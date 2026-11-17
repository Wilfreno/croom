import { mockConversation, mockMessage, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { mockSocket } from '@/__tests__/mocks/mock-socket';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import SocketIOProvider, { useSocketIO } from '@/components/providers/SocketIOProvider';
import { CALL_RING_DURATION_MS, REMOVED_FROM_GROUP_CHAT } from '@repo/constants';
import { MessageNoticeType } from '@repo/enums';
import type { Conversation, Message, MessagePayload, UserSession } from '@repo/types';
import type { InfiniteData } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import React from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { custom: vi.fn(), error: vi.fn() }) }));

let sessionUser: UserSession | null;
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session: { user: sessionUser } }) }));

let onMobile = false;
vi.mock('@/components/hooks/useUserAgent', () => ({ default: () => ({ onMobile }) }));

const push = vi.fn();
let pathname = '/';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => pathname }));

type MessagePages = InfiniteData<{ pageParam: number; result: Message[] }, unknown>;

let server: ReturnType<typeof mockSocket>;

function payloadIn(conversationId: string): MessagePayload {
  return { ...mockMessage(), conversation: { id: conversationId, nicknames: [] } } as MessagePayload;
}

function renderProvider(children: React.ReactNode = null) {
  return renderWithQuery(<SocketIOProvider>{children}</SocketIOProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  server = mockSocket();
  vi.mocked(io).mockReturnValue(server.socket as never);
  sessionUser = mockSession();
  pathname = '/';
  onMobile = false;
});

describe('SocketIOProvider', () => {
  it('does not connect without a session', () => {
    sessionUser = null;

    renderProvider();

    expect(io).not.toHaveBeenCalled();
  });

  it('connects to the /io namespace with credentials and shares the socket', async () => {
    let shared: unknown;
    function Probe() {
      shared = useSocketIO();
      return null;
    }

    renderProvider(<Probe />);

    expect(io).toHaveBeenCalledWith(process.env.NEXT_PUBLIC_SERVER + '/io', { withCredentials: true });
    await waitFor(() => expect(shared).toBe(server.socket));
  });

  it('gives null outside the provider', () => {
    let shared: unknown = 'unset';
    function Probe() {
      shared = useSocketIO();
      return null;
    }

    renderWithQuery(<Probe />);

    expect(shared).toBeNull();
  });

  describe('MESSAGE', () => {
    it('appends a message for the open conversation to its cache, without a toast', () => {
      pathname = '/conversation/c1';
      const existing = mockMessage();
      const { queryClient } = renderProvider();
      queryClient.setQueryData<MessagePages>(['conversation', 'messages', 'c1'], {
        pages: [{ pageParam: 1, result: [existing] }],
        pageParams: [1],
      });
      const payload = payloadIn('c1');

      act(() => server.serverEmit('MESSAGE', payload));

      const cache = queryClient.getQueryData<MessagePages>(['conversation', 'messages', 'c1'])!;
      expect(cache.pages[0].result).toEqual([existing, { ...payload, conversation: 'c1' }]);
      expect(toast.custom).not.toHaveBeenCalled();
    });

    it('shows a toast for a message in another conversation', () => {
      pathname = '/conversation/c1';
      renderProvider();

      act(() => server.serverEmit('MESSAGE', payloadIn('c2')));

      expect(toast.custom).toHaveBeenCalledWith(expect.any(Function), {
        duration: Infinity,
        className: 'rounded-lg w-full hover:h-fit',
        position: 'bottom-right',
      });
    });

    describe('nickname notices', () => {
      function noticeIn(conversationId: string, user: string, value = 'Ace'): MessagePayload {
        return {
          ...mockMessage({ text: '', sender: mockUser({ displayName: 'Ada' }) }),
          notice: { type: MessageNoticeType.NICKNAME, user, value },
          conversation: { id: conversationId, nicknames: [{ user, value }] },
        } as MessagePayload;
      }

      it('updates the cached nicknames everywhere', () => {
        const { queryClient } = renderProvider();
        const conversation = mockConversation({ id: 'c2', nicknames: [{ user: sessionUser!.id, value: '' }] });
        queryClient.setQueryData(['conversation', 'c2'], conversation);
        queryClient.setQueryData([sessionUser!.id, 'conversations'], [conversation]);
        queryClient.setQueryData(['active', 'conversations', sessionUser!.id], [conversation]);

        act(() => server.serverEmit('MESSAGE', noticeIn('c2', sessionUser!.id)));

        const expected = [{ user: sessionUser!.id, value: 'Ace' }];
        expect(queryClient.getQueryData<Conversation>(['conversation', 'c2'])!.nicknames).toEqual(expected);
        for (const key of [[sessionUser!.id, 'conversations'], ['active', 'conversations', sessionUser!.id]])
          expect(queryClient.getQueryData<Conversation[]>(key)![0].nicknames).toEqual(expected);
      });

      it('tells you when someone changed your nickname elsewhere, without a reply toast', () => {
        pathname = '/conversation/c1';
        renderProvider();

        act(() => server.serverEmit('MESSAGE', noticeIn('c2', sessionUser!.id)));

        expect(toast).toHaveBeenCalledWith('Ada set your nickname to Ace');
        expect(toast.custom).not.toHaveBeenCalled();
      });

      it("stays quiet about someone else's nickname in another conversation", () => {
        renderProvider();

        act(() => server.serverEmit('MESSAGE', noticeIn('c2', 'someone-else')));

        expect(toast).not.toHaveBeenCalled();
        expect(toast.custom).not.toHaveBeenCalled();
      });
    });

    it('puts the toast at the top on mobile', () => {
      onMobile = true;
      renderProvider();

      act(() => server.serverEmit('MESSAGE', payloadIn('c2')));

      expect(vi.mocked(toast.custom).mock.calls[0][1]).toMatchObject({ position: 'top-center' });
    });
  });

  it('refreshes conversation queries, but not message pages, when someone comes online', async () => {
    const { queryClient } = renderProvider();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    act(() => server.serverEmit('USER_STATUS', { userId: 'u', status: 'online', lastOnline: '' }));

    const { predicate } = invalidate.mock.calls[0][0] as unknown as { predicate: (q: { queryKey: unknown[] }) => boolean };
    expect(predicate({ queryKey: ['me', 'conversations'] })).toBe(true);
    expect(predicate({ queryKey: ['conversation', 'c1'] })).toBe(true);
    expect(predicate({ queryKey: ['conversation', 'info', 'c1'] })).toBe(true);
    expect(predicate({ queryKey: ['conversation', 'messages', 'c1'] })).toBe(false);
    expect(predicate({ queryKey: ['user', 'session'] })).toBe(false);
  });

  it('rings with one toast per call that opens the call when accepted', () => {
    renderProvider();
    const call = { conversationId: 'c1', caller: { id: 'u', displayName: 'Bob', photoUrl: null } };

    act(() => server.serverEmit('INCOMING_CALL', call));

    const [render, options] = vi.mocked(toast.custom).mock.calls[0];
    expect(options).toMatchObject({ id: 'incoming-call-c1', duration: CALL_RING_DURATION_MS });

    const element = render('toast-1') as React.ReactElement<{ call: unknown; onAccept: () => void }>;
    expect(element.props.call).toBe(call);
    element.props.onAccept();
    expect(push).toHaveBeenCalledWith('/call/c1');
  });

  describe('CONVERSATION_MEMBERS_CHANGED', () => {
    function seedLists(queryClient: ReturnType<typeof renderProvider>['queryClient']) {
      const group = mockConversation({ id: 'c1' });
      const other = mockConversation({ id: 'c2' });
      queryClient.setQueryData([sessionUser!.id, 'conversations'], [group, other]);
      queryClient.setQueryData(['active', 'conversations', sessionUser!.id], [group]);
      queryClient.setQueryData(['conversation', 'c1'], group);
      queryClient.setQueryData(['conversation', 'messages', 'c1'], { pages: [], pageParams: [] });
      return { other };
    }

    it('drops the group and leaves its page when you were removed', () => {
      pathname = '/conversation/c1';
      const { queryClient } = renderProvider();
      const { other } = seedLists(queryClient);

      act(() => server.serverEmit('CONVERSATION_MEMBERS_CHANGED', { conversationId: 'c1', removedMemberId: sessionUser!.id }));

      expect(toast).toHaveBeenCalledWith(REMOVED_FROM_GROUP_CHAT);
      expect(queryClient.getQueryData([sessionUser!.id, 'conversations'])).toEqual([other]);
      expect(queryClient.getQueryData(['active', 'conversations', sessionUser!.id])).toEqual([]);
      expect(queryClient.getQueryData(['conversation', 'c1'])).toBeUndefined();
      expect(queryClient.getQueryData(['conversation', 'messages', 'c1'])).toBeUndefined();
      expect(push).toHaveBeenCalledWith('/');
    });

    it('stays on another page when you were removed from a group you do not have open', () => {
      pathname = '/conversation/c2';
      const { queryClient } = renderProvider();
      seedLists(queryClient);

      act(() => server.serverEmit('CONVERSATION_MEMBERS_CHANGED', { conversationId: 'c1', removedMemberId: sessionUser!.id }));

      expect(push).not.toHaveBeenCalled();
    });

    it('refreshes the group and both lists when someone else joined or left', () => {
      const { queryClient } = renderProvider();
      seedLists(queryClient);
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

      act(() => server.serverEmit('CONVERSATION_MEMBERS_CHANGED', { conversationId: 'c1', removedMemberId: 'someone-else' }));

      expect(invalidate).toHaveBeenCalledWith({ exact: true, queryKey: ['conversation', 'c1'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [sessionUser!.id, 'conversations'] });
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['active', 'conversations', sessionUser!.id] });
      expect(toast).not.toHaveBeenCalled();
      expect(queryClient.getQueryData(['conversation', 'c1'])).toBeDefined();
    });
  });

  it('shows server errors as a toast', () => {
    renderProvider();

    act(() => server.serverEmit('ERROR', 'you are not a member of this conversation'));

    expect(toast).toHaveBeenCalledWith('you are not a member of this conversation');
  });

  it('removes its listeners and disconnects on unmount', () => {
    const { unmount } = renderProvider();

    unmount();

    for (const event of ['MESSAGE', 'USER_STATUS', 'ERROR', 'INCOMING_CALL', 'CONVERSATION_MEMBERS_CHANGED'])
      expect(server.listenerCount(event)).toBe(0);
    expect(server.spies.disconnect).toHaveBeenCalled();
  });
});
