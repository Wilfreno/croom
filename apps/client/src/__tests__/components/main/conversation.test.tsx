import { stubImageLoading, UPLOADED_PHOTO } from '@/__tests__/mocks/mock-components';
import { mockConversation, mockMessage, mockPhoto, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { makeQueryClient } from '@/__tests__/mocks/MockQueryClientProvider';
import { mockSocket } from '@/__tests__/mocks/mock-socket';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import ConversationHeader from '@/components/page/main/conversation/ConversationHeader';
import ConversationMessage from '@/components/page/main/conversation/ConversationMessage';
import ConversationMessageInput from '@/components/page/main/conversation/ConversationMessageInput';
import ConversationMessages from '@/components/page/main/conversation/ConversationMessages';
import MessageToast from '@/components/page/main/conversation/MessageToast';
import { axiosInstance } from '@/lib/axios-instance';
import useRingtone from '@/components/hooks/useRingtone';
import { CALL_RINGBACK_TONE, CALL_RING_DURATION_MS, SOMETHING_WENT_WRONG } from '@repo/constants';
import { MessageNoticeType, UserStatus } from '@repo/enums';
import type { Message, MessagePayload, User, UserSession } from '@repo/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/page/UploadthingButton', async () => (await import('@/__tests__/mocks/mock-components')).uploadthingModule);
vi.mock('emoji-picker-react', async () => (await import('@/__tests__/mocks/mock-components')).emojiPickerModule);
vi.mock('next/image', async () => (await import('@/__tests__/mocks/mock-components')).nextImageModule);
vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { patch: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}) } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), dismiss: vi.fn() }) }));
vi.mock('@/components/hooks/useRingtone', () => ({ default: vi.fn() }));

let sessionUser: UserSession;
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session: { user: sessionUser } }) }));

let server: ReturnType<typeof mockSocket>;
vi.mock('@/components/providers/SocketIOProvider', () => ({ useSocketIO: () => server.socket }));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), useParams: () => ({ id: 'c1' }) }));

const sidebar = { onMobile: false, setIsOpen: vi.fn() };
vi.mock('@/components/hooks/queries/useInfoSidebarOpen', () => ({ default: () => sidebar }));

const sendMessage = { mutate: vi.fn(), isPending: false };
const sendMessageHookSpy = vi.fn((_text: string) => ({ sendMessage }));
vi.mock('@/components/hooks/mutation/useSendMessage.mutation', () => ({ default: (text: string) => sendMessageHookSpy(text) }));

let messagePages: { pages: { pageParam: number; result: Message[] }[] } | undefined;
vi.mock('@/components/hooks/queries/useMessages', () => ({ default: () => ({ foundMessages: messagePages }) }));

beforeEach(() => {
  vi.clearAllMocks();
  server = mockSocket({ CALL: { isOngoing: false, ringingCount: 1 }, CALL_CANCEL: { isAnswered: false } });
  sessionUser = mockSession();
  sidebar.onMobile = false;
  sendMessage.isPending = false;
  messagePages = undefined;
  stubImageLoading();
});
afterEach(() => vi.unstubAllGlobals());

const NOW = Date.now();
function at(secondsAgo: number) {
  return new Date(NOW - secondsAgo * 1000);
}

describe('ConversationHeader', () => {
  const info = { photoUrl: '', conversationName: 'Bob', status: UserStatus.ONLINE, isOnline: true, lastOnline: '' };

  it('shows the conversation name', () => {
    renderWithQuery(<ConversationHeader conversationInfo={info} />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the online dot only for someone online', () => {
    const { container, rerender, queryClient } = renderWithQuery(<ConversationHeader conversationInfo={info} />);
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <ConversationHeader conversationInfo={{ ...info, status: UserStatus.OFFLINE, isOnline: false, lastOnline: '5 minute(s) ago' }} />
      </QueryClientProvider>,
    );
    expect(container.querySelector('.bg-green-500')).not.toBeInTheDocument();
    expect(screen.getByText('5 minute(s) ago')).toBeInTheDocument();
  });

  it('shows a group chat as its first online member plus how many others', () => {
    const conversation = mockConversation({ name: 'Team', isGroupChat: true, members: [mockUser(), mockUser(), mockUser()] });

    renderWithQuery(<ConversationHeader conversationInfo={info} conversation={conversation} />);

    expect(screen.getByLabelText('and 2 more')).toHaveTextContent('+2');
  });

  describe('calling', () => {
    function oneOnOne() {
      return mockConversation({ id: 'c1', members: [sessionUser as unknown as User, mockUser({ id: 'bob' })] });
    }

    async function call(conversation = oneOnOne()) {
      const rendered = renderWithQuery(<ConversationHeader conversationInfo={info} conversation={conversation} />);
      await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));
      const dialog = await screen.findByRole('dialog');
      return Object.assign(dialog, { unmount: rendered.unmount });
    }

    it('rings the conversation and waits in a dialog instead of opening the call', async () => {
      const dialog = await call();

      expect(server.emitWithAck).toHaveBeenCalledWith('CALL', { conversationId: 'c1' });
      expect(within(dialog).getByText('Bob')).toBeInTheDocument();
      expect(within(dialog).getByText('Calling…')).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });

    it('plays the ringback tone only while ringing', async () => {
      const dialog = await call();
      expect(useRingtone).toHaveBeenLastCalledWith(CALL_RINGBACK_TONE, true);

      act(() => server.serverEmit('CALL_DECLINED', { conversationId: 'c1', userId: 'bob' }));

      expect(within(dialog).getByText('Call declined')).toBeInTheDocument();
      expect(useRingtone).toHaveBeenLastCalledWith(CALL_RINGBACK_TONE, false);
    });

    it('opens the call once someone accepts', async () => {
      await call();

      act(() => server.serverEmit('CALL_ACCEPTED', { conversationId: 'other', userId: 'bob' }));
      act(() => server.serverEmit('CALL_ACCEPTED', { conversationId: 'c1', userId: sessionUser.id }));
      expect(push).not.toHaveBeenCalled();

      act(() => server.serverEmit('CALL_ACCEPTED', { conversationId: 'c1', userId: 'bob' }));
      expect(push).toHaveBeenCalledWith('/call/c1');
    });

    it('goes straight in when the call is already running, without showing the ringing dialog', async () => {
      server.replies.CALL = { isOngoing: true, ringingCount: 0 };
      const { unmount } = renderWithQuery(<ConversationHeader conversationInfo={info} conversation={oneOnOne()} />);

      await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));

      await waitFor(() => expect(push).toHaveBeenCalledWith('/call/c1'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      unmount();
      expect(server.emitWithAck).not.toHaveBeenCalledWith('CALL_CANCEL', expect.anything());
    });

    it('stops ringing instead of starting over when the connection is replaced', async () => {
      const previous = server;
      const { rerender, queryClient } = renderWithQuery(<ConversationHeader conversationInfo={info} conversation={oneOnOne()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));
      const dialog = await screen.findByRole('dialog');

      server = mockSocket({ CALL: { isOngoing: false, ringingCount: 1 }, CALL_CANCEL: { isAnswered: false } });
      rerender(
        <QueryClientProvider client={queryClient}>
          <ConversationHeader conversationInfo={info} conversation={oneOnOne()} />
        </QueryClientProvider>,
      );

      expect(previous.emitWithAck).toHaveBeenCalledWith('CALL_CANCEL', { conversationId: 'c1' });
      expect(await within(dialog).findByText('No answer')).toBeInTheDocument();
    });

    describe('answers that arrive before the server confirms the ring', () => {
      async function startWithHeldReply() {
        let answer: (reply: unknown) => void = () => undefined;
        server.replies.CALL = () => new Promise((resolve) => (answer = resolve));
        renderWithQuery(<ConversationHeader conversationInfo={info} conversation={oneOnOne()} />);
        await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));
        return (reply: unknown) => act(async () => answer(reply));
      }

      it('joins when someone accepted first', async () => {
        const reply = await startWithHeldReply();

        act(() => server.serverEmit('CALL_ACCEPTED', { conversationId: 'c1', userId: 'bob' }));
        await reply({ isOngoing: false, ringingCount: 1 });

        expect(push).toHaveBeenCalledWith('/call/c1');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      it('says declined when everyone declined first', async () => {
        const reply = await startWithHeldReply();

        act(() => server.serverEmit('CALL_DECLINED', { conversationId: 'c1', userId: 'bob' }));
        await reply({ isOngoing: false, ringingCount: 1 });

        expect(within(await screen.findByRole('dialog')).getByText('Call declined')).toBeInTheDocument();
      });

      it('says no answer when the ring was cancelled first', async () => {
        const reply = await startWithHeldReply();

        act(() => server.serverEmit('CALL_CANCELLED', { conversationId: 'c1' }));
        await reply({ isOngoing: false, ringingCount: 1 });

        expect(within(await screen.findByRole('dialog')).getByText('No answer')).toBeInTheDocument();
      });

      it('ignores answers for another conversation', async () => {
        const reply = await startWithHeldReply();

        act(() => server.serverEmit('CALL_ACCEPTED', { conversationId: 'other', userId: 'bob' }));
        await reply({ isOngoing: false, ringingCount: 1 });

        expect(push).not.toHaveBeenCalled();
        expect(within(await screen.findByRole('dialog')).getByText('Calling…')).toBeInTheDocument();
      });
    });

    it('rings only once when the button is clicked twice in a row', async () => {
      let answer: (reply: unknown) => void = () => undefined;
      server.replies.CALL = () => new Promise((resolve) => (answer = resolve));
      renderWithQuery(<ConversationHeader conversationInfo={info} conversation={oneOnOne()} />);
      const button = screen.getByRole('button', { name: 'Start video call' });

      await userEvent.click(button);
      await userEvent.click(button);
      await act(async () => answer({ isOngoing: false, ringingCount: 1 }));

      expect(server.emitWithAck.mock.calls.filter(([event]) => event === 'CALL')).toHaveLength(1);
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('stops showing "Calling…" when the server cancels the ring', async () => {
      const dialog = await call();

      act(() => server.serverEmit('CALL_CANCELLED', { conversationId: 'other' }));
      expect(within(dialog).getByText('Calling…')).toBeInTheDocument();

      act(() => server.serverEmit('CALL_CANCELLED', { conversationId: 'c1' }));
      expect(within(dialog).getByText('No answer')).toBeInTheDocument();
    });

    it('goes straight in when there is nobody else to ring', async () => {
      server.replies.CALL = { isOngoing: false, ringingCount: 0 };
      renderWithQuery(
        <ConversationHeader conversationInfo={info} conversation={mockConversation({ id: 'c1', isGroupChat: true, members: [sessionUser as unknown as User] })} />,
      );

      await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));

      await waitFor(() => expect(push).toHaveBeenCalledWith('/call/c1'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('says the call was declined once everyone declines, and can call again', async () => {
      const group = mockConversation({
        id: 'c1',
        isGroupChat: true,
        members: [sessionUser as unknown as User, mockUser({ id: 'bob' }), mockUser({ id: 'carol' })],
      });
      server.replies.CALL = { isOngoing: false, ringingCount: 2 };
      const dialog = await call(group);

      act(() => server.serverEmit('CALL_DECLINED', { conversationId: 'c1', userId: 'bob' }));
      act(() => server.serverEmit('CALL_DECLINED', { conversationId: 'c1', userId: 'bob' }));
      expect(within(dialog).getByText('Calling…')).toBeInTheDocument();

      act(() => server.serverEmit('CALL_DECLINED', { conversationId: 'c1', userId: 'carol' }));
      expect(within(dialog).getByText('Call declined')).toBeInTheDocument();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Call again' }));
      expect(server.emitWithAck).toHaveBeenCalledTimes(2);
      expect(within(dialog).getByText('Calling…')).toBeInTheDocument();
    });

    it('cancels the ring', async () => {
      const dialog = await call();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel call' }));

      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_CANCEL', { conversationId: 'c1' });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(push).not.toHaveBeenCalled();
    });

    it('joins instead when someone answered just before you cancelled', async () => {
      server.replies.CALL_CANCEL = { isAnswered: true };
      const dialog = await call();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel call' }));

      await waitFor(() => expect(push).toHaveBeenCalledWith('/call/c1'));
    });

    it('stops the ring when you leave the page while it rings', async () => {
      const dialog = await call();

      dialog.unmount();

      expect(server.emitWithAck).toHaveBeenCalledWith('CALL_CANCEL', { conversationId: 'c1' });
    });

    it('does not stop the ring when you leave the page to join the answered call', async () => {
      const dialog = await call();
      act(() => server.serverEmit('CALL_ACCEPTED', { conversationId: 'c1', userId: 'bob' }));

      dialog.unmount();

      expect(server.emitWithAck).not.toHaveBeenCalledWith('CALL_CANCEL', expect.anything());
    });

    it('gives up with "No answer" when nobody picks up in time', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        const dialog = await call();

        act(() => vi.advanceTimersByTime(CALL_RING_DURATION_MS));

        expect(await within(dialog).findByText('No answer')).toBeInTheDocument();
        expect(server.emitWithAck).toHaveBeenCalledWith('CALL_CANCEL', { conversationId: 'c1' });
        expect(push).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('joins instead of giving up when someone answered right as the ring ran out', async () => {
      server.replies.CALL_CANCEL = { isAnswered: true };
      vi.useFakeTimers({ shouldAdvanceTime: true });
      try {
        await call();

        act(() => vi.advanceTimersByTime(CALL_RING_DURATION_MS));

        await waitFor(() => expect(push).toHaveBeenCalledWith('/call/c1'));
      } finally {
        vi.useRealTimers();
      }
    });

    it('waits for everyone the server rang before saying declined, even before the conversation loads', async () => {
      server.replies.CALL = { isOngoing: false, ringingCount: 2 };
      renderWithQuery(<ConversationHeader conversationInfo={info} />);
      await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));
      const dialog = await screen.findByRole('dialog');
      await waitFor(() => expect(server.emitWithAck).toHaveBeenCalledWith('CALL', { conversationId: 'c1' }));

      act(() => server.serverEmit('CALL_DECLINED', { conversationId: 'c1', userId: 'bob' }));
      expect(within(dialog).getByText('Calling…')).toBeInTheDocument();

      act(() => server.serverEmit('CALL_DECLINED', { conversationId: 'c1', userId: 'carol' }));
      expect(within(dialog).getByText('Call declined')).toBeInTheDocument();
    });

    it('closes the dialog when the server refuses the call', async () => {
      server.replies.CALL = { error: 'you cannot call this conversation' };

      renderWithQuery(<ConversationHeader conversationInfo={info} conversation={oneOnOne()} />);

      await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(push).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['you blocked', () => sessionUser.id],
    ['you were blocked', () => 'someone-else'],
  ])('offers no video call in a conversation %s', (_, blocker) => {
    renderWithQuery(
      <ConversationHeader conversationInfo={info} conversation={mockConversation({ status: 'BLOCKED', blocker: blocker() })} />,
    );

    expect(screen.queryByRole('button', { name: 'Start video call' })).not.toBeInTheDocument();
  });

  it('toggles the info sidebar', async () => {
    renderWithQuery(<ConversationHeader conversationInfo={info} />);
    const buttons = screen.getAllByRole('button');

    await userEvent.click(buttons[buttons.length - 1]);

    const toggle = sidebar.setIsOpen.mock.calls[0][0] as (prev: boolean) => boolean;
    expect(toggle(true)).toBe(false);
  });

  it('goes back home from the back button', async () => {
    renderWithQuery(<ConversationHeader conversationInfo={info} />);

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(push).toHaveBeenCalledWith('/');
  });
});

describe('ConversationMessage', () => {
  const other = mockUser({ displayName: 'Bob' });

  function message(overrides: Partial<Message> = {}) {
    return mockMessage({ sender: other, dateCreated: at(10), ...overrides });
  }

  it('shows the text and the time for a first message', () => {
    renderWithQuery(<ConversationMessage message={message({ text: 'hello there' })} isLastMessage={false} />);

    expect(screen.getByText('hello there')).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('hides the time between messages sent within a minute', () => {
    const prev = message({ dateCreated: at(40) });

    renderWithQuery(<ConversationMessage message={message({ text: 'follow-up' })} prevMessage={prev} isLastMessage={false} />);

    expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
  });

  it('shows the time again after more than a minute', () => {
    const prev = message({ dateCreated: at(600) });

    renderWithQuery(<ConversationMessage message={message()} prevMessage={prev} isLastMessage={false} />);

    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('puts your own messages on the right, without an avatar', () => {
    const { container } = renderWithQuery(
      <ConversationMessage message={message({ sender: mockUser({ id: sessionUser.id }), text: 'mine' })} isLastMessage={false} />,
    );

    expect(screen.getByText('mine').parentElement).toHaveClass('bg-primary', 'justify-self-end');
    expect(container.querySelector('.grid-cols-\\[auto_1fr\\]')).not.toBeInTheDocument();
  });

  it("puts other people's messages on the left with their avatar", () => {
    const { container } = renderWithQuery(<ConversationMessage message={message({ text: 'theirs' })} isLastMessage={false} />);

    expect(screen.getByText('theirs').parentElement).toHaveClass('bg-secondary', 'justify-self-start');
    expect(container.querySelector('.grid-cols-\\[auto_minmax\\(0\\,1fr\\)\\]')).toBeInTheDocument();
  });

  it("shows the sender's initials when they have no photo", () => {
    renderWithQuery(
      <ConversationMessage message={message({ sender: mockUser({ displayName: 'Bob Marley', photo: undefined }) })} isLastMessage={false} />,
    );

    expect(screen.getByText('BM')).toBeInTheDocument();
  });

  it('only shows the avatar on the last of a quick run of messages', () => {
    const prev = message({ dateCreated: at(30) });
    const next = message({ dateCreated: at(5) });

    const { container } = renderWithQuery(
      <ConversationMessage message={message({ dateCreated: at(20) })} prevMessage={prev} nextMessage={next} isLastMessage={false} />,
    );

    expect(container.querySelector('.opacity-0')).toBeInTheDocument();
  });

  describe('nickname notices', () => {
    function withConversation(ui: React.ReactElement) {
      const queryClient = makeQueryClient();
      queryClient.setDefaultOptions({ queries: { staleTime: Infinity, gcTime: Infinity } });
      const conversation = mockConversation({
        id: 'c1',
        members: [other, sessionUser as unknown as User],
        nicknames: [
          { user: other.id, value: '' },
          { user: sessionUser.id, value: 'Ace' },
        ],
      });
      queryClient.setQueryData(['conversation', 'c1'], conversation);
      return { ...renderWithQuery(React.cloneElement(ui, { conversation } as never), queryClient), conversation };
    }

    const notice = (user: string, value = 'Ace') =>
      message({ text: '', notice: { type: MessageNoticeType.NICKNAME, user, value } });

    it('reads as a centered sentence instead of a bubble', () => {
      const { container } = withConversation(
        <ConversationMessage message={notice(sessionUser.id)} isLastMessage={false} />,
      );

      expect(screen.getByText((_, element) => element?.textContent === 'Bob set your nickname to Ace' && element.tagName === 'SPAN')).toBeInTheDocument();
      expect(container.querySelector('.border')).not.toBeInTheDocument();
      expect(container.querySelector('.grid-cols-\\[auto_1fr\\]')).not.toBeInTheDocument();
    });

    it('highlights who made the change and the new nickname', () => {
      withConversation(<ConversationMessage message={notice(sessionUser.id)} isLastMessage={false} />);

      expect(screen.getByText('Bob')).toHaveClass('font-medium', 'text-foreground');
      expect(screen.getByText('Ace')).toHaveClass('font-medium', 'text-foreground');
    });

    it("opens the nickname editor on that person's nickname from the pen", async () => {
      withConversation(<ConversationMessage message={notice(sessionUser.id)} isLastMessage={false} />);

      await userEvent.click(screen.getByRole('button', { name: 'Edit nickname' }));

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByLabelText(`Nickname for ${sessionUser.displayName}`)).toHaveValue('Ace');
    });

    it('has no pen when you cannot change nicknames', () => {
      withConversation(
        <ConversationMessage message={notice(sessionUser.id)} isLastMessage={false} canEditNicknames={false} />,
      );

      expect(screen.queryByRole('button', { name: 'Edit nickname' })).not.toBeInTheDocument();
    });

    it('does not fold the next message from the same person into the notice', () => {
      const { container } = renderWithQuery(
        <ConversationMessage
          message={message({ dateCreated: at(20) })}
          prevMessage={notice(sessionUser.id)}
          nextMessage={notice(other.id)}
          isLastMessage={false}
        />,
      );

      expect(container.querySelector('.opacity-0')).not.toBeInTheDocument();
    });
  });

  it('shows a message that is a single emoji big, without a bubble', () => {
    renderWithQuery(<ConversationMessage message={message({ text: '👍' })} isLastMessage={false} />);

    const bubble = screen.getByText('👍').parentElement!;
    expect(bubble).toHaveClass('text-4xl');
    expect(bubble).not.toHaveClass('border');
  });

  it('keeps text with an emoji in a normal bubble', () => {
    renderWithQuery(<ConversationMessage message={message({ text: 'nice 👍' })} isLastMessage={false} />);

    expect(screen.getByText('nice 👍').parentElement).toHaveClass('border');
  });

  it.each([
    [1, 'grid-cols-1'],
    [2, 'grid-cols-2'],
    [4, 'grid-cols-2'],
    [5, 'grid-cols-3'],
  ])('lays %i photo(s) out as %s', (count, columns) => {
    const photos = Array.from({ length: count }, () => mockPhoto());

    const { container } = renderWithQuery(<ConversationMessage message={message({ text: '', photos })} isLastMessage={false} />);

    // Message photos are decorative (alt=""), so query the elements rather than by role.
    expect(container.querySelectorAll('img')).toHaveLength(count);
    expect(container.querySelector(`.${columns}`)).toBeInTheDocument();
  });

  it('rounds only the outer corners of a photo group, including the end of a short row', () => {
    // 5 photos in 3 columns: a full row of 3, then 2.
    const photos = Array.from({ length: 5 }, () => mockPhoto());

    const { container } = renderWithQuery(<ConversationMessage message={message({ text: '', photos })} isLastMessage={false} />);

    const corners = [...container.querySelectorAll('img')].map((img) => img.parentElement!.className);
    expect(corners[0]).toContain('rounded-tl-md');
    expect(corners[2]).toContain('rounded-tr-md');
    expect(corners[2]).toContain('rounded-br-md');
    expect(corners[3]).toContain('rounded-bl-md');
    expect(corners[4]).toContain('rounded-br-md');
    expect(corners[1]).not.toMatch(/rounded-(tl|tr|bl|br)-md/);
  });

  it('scrolls the last message into view again when it fails, so the note is visible', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const pending = { ...message({ text: 'lost' }), pending: true };

    const { rerender, queryClient } = renderWithQuery(<ConversationMessage message={pending} isLastMessage />);
    scrollIntoView.mockClear();
    rerender(
      <QueryClientProvider client={queryClient}>
        <ConversationMessage message={{ ...pending, pending: false, failed: true }} isLastMessage />
      </QueryClientProvider>,
    );

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'nearest' });
  });

  it('marks the last message as seen and scrolls it into view', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const msg = message();

    const { queryClient } = renderWithQuery(<ConversationMessage message={msg} isLastMessage />);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'nearest' });
    await waitFor(() =>
      expect(axiosInstance.patch).toHaveBeenCalledWith(`/message/${msg.id}/seenBy`, {
        conversationId: msg.conversation,
        action: 'ADD',
      }),
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ exact: true, queryKey: [sessionUser.id, 'conversations'] }),
    );
  });

  it('does not mark the last message as seen when told not to', async () => {
    renderWithQuery(<ConversationMessage message={message()} isLastMessage markSeen={false} />);

    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it('refreshes the conversation when marking seen is refused because you were blocked', async () => {
    vi.mocked(axiosInstance.patch).mockRejectedValueOnce(
      new AxiosError('423', undefined, undefined, undefined, {
        status: 423,
        data: { status: 'BLOCKED', message: 'you are blocked in this conversation', data: null },
      } as never),
    );
    const msg = message({ conversation: 'c1' });

    const { queryClient } = renderWithQuery(<ConversationMessage message={msg} isLastMessage />);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['conversation', 'c1'] }));
  });

  it('does not mark earlier messages as seen', () => {
    renderWithQuery(<ConversationMessage message={message()} isLastMessage={false} />);

    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it('shows a message that is still sending muted, and full color once saved', () => {
    const msg = message({ text: 'on its way' });

    const { rerender, queryClient } = renderWithQuery(
      <ConversationMessage message={{ ...msg, pending: true }} isLastMessage={false} />,
    );
    const bubble = screen.getByText('on its way').closest('[class*="transition-opacity"]')!;
    expect(bubble).toHaveClass('opacity-50');
    expect(bubble).toHaveAttribute('aria-busy', 'true');

    rerender(
      <QueryClientProvider client={queryClient}>
        <ConversationMessage message={msg} isLastMessage={false} />
      </QueryClientProvider>,
    );
    expect(bubble).not.toHaveClass('opacity-50');
    expect(bubble).not.toHaveAttribute('aria-busy');
  });

  it('keeps a message that failed to send muted, with a note below it', () => {
    renderWithQuery(
      <ConversationMessage message={{ ...message({ text: 'lost' }), failed: true }} isLastMessage={false} />,
    );

    expect(screen.getByText('lost').closest('[class*="transition-opacity"]')).toHaveClass('opacity-50');
    expect(screen.getByRole('alert')).toHaveTextContent('Message not sent');
  });

  it('retries a failed message when its note or bubble is tapped', async () => {
    const onRetry = vi.fn();
    const failed = { ...message({ text: 'lost' }), failed: true };
    renderWithQuery(<ConversationMessage message={failed} isLastMessage={false} onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await userEvent.click(screen.getByText('lost'));

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(failed);
  });

  it('shows a loading note instead of Retry while a message is being resent', () => {
    const onRetry = vi.fn();
    renderWithQuery(
      <ConversationMessage
        message={{ ...message({ text: 'lost' }), pending: true, resending: true }}
        isLastMessage={false}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Resending');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('does nothing when a sent message is tapped', async () => {
    const onRetry = vi.fn();
    renderWithQuery(<ConversationMessage message={message({ text: 'fine' })} isLastMessage={false} onRetry={onRetry} />);

    await userEvent.click(screen.getByText('fine'));

    expect(onRetry).not.toHaveBeenCalled();
  });

  it('shows no note for a message that was sent', () => {
    renderWithQuery(<ConversationMessage message={message()} isLastMessage={false} />);

    expect(screen.queryByText('Message not sent')).not.toBeInTheDocument();
  });

  it('never marks a message that failed to send as seen', () => {
    Element.prototype.scrollIntoView = vi.fn();

    renderWithQuery(<ConversationMessage message={{ ...message(), id: 'pending-1', failed: true }} isLastMessage />);

    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it('waits for a pending last message to be saved before marking it seen', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const msg = message();

    renderWithQuery(<ConversationMessage message={{ ...msg, id: 'pending-1', pending: true }} isLastMessage />);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  describe('call notices', () => {
    const callNotice = (type: MessageNoticeType, sender = other, value = '') =>
      message({ text: '', sender, notice: { type, user: sender.id, value } });

    it.each([
      [MessageNoticeType.CALL_RING, '', 'Bob started a call'],
      [MessageNoticeType.CALL_STARTED, '', 'Call started'],
      [MessageNoticeType.CALL_ENDED, '95', 'Call ended · 1:35'],
      [MessageNoticeType.CALL_MISSED, '', 'You missed a call from Bob'],
    ])('reads %s as a centered sentence', (type, value, text) => {
      const { container } = renderWithQuery(
        <ConversationMessage message={callNotice(type, other, value)} isLastMessage={false} />,
      );

      expect(screen.getByText(text)).toBeInTheDocument();
      expect(container.querySelector('.border')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit nickname' })).not.toBeInTheDocument();
    });

    it('says you started the call when you did', () => {
      renderWithQuery(
        <ConversationMessage
          message={callNotice(MessageNoticeType.CALL_RING, sessionUser as unknown as User)}
          isLastMessage={false}
        />,
      );

      expect(screen.getByText('You started a call')).toBeInTheDocument();
    });
  });
});

describe('ConversationMessages', () => {
  it('renders every message across pages and marks only the very last as last', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const first = mockMessage({ text: 'first' });
    const second = mockMessage({ text: 'second' });
    const third = mockMessage({ text: 'third' });
    messagePages = { pages: [{ pageParam: 1, result: [first, second] }, { pageParam: 2, result: [third] }] };

    renderWithQuery(<ConversationMessages conversation={mockConversation()} />);

    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('third')).toBeInTheDocument();
    await waitFor(() => expect(axiosInstance.patch).toHaveBeenCalledTimes(1));
    expect(axiosInstance.patch).toHaveBeenCalledWith(`/message/${third.id}/seenBy`, expect.anything());
  });

  it('does not mark the last message as seen for the member who was blocked', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    messagePages = { pages: [{ pageParam: 1, result: [mockMessage({ text: 'before the block' })] }] };

    renderWithQuery(<ConversationMessages conversation={mockConversation({ status: 'BLOCKED', blocker: 'someone-else' })} />);

    expect(screen.getByText('before the block')).toBeInTheDocument();
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it('still marks the last message as seen for the member who did the blocking', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const last = mockMessage({ text: 'before the block' });
    messagePages = { pages: [{ pageParam: 1, result: [last] }] };

    renderWithQuery(<ConversationMessages conversation={mockConversation({ status: 'BLOCKED', blocker: sessionUser.id })} />);

    await waitFor(() => expect(axiosInstance.patch).toHaveBeenCalledWith(`/message/${last.id}/seenBy`, expect.anything()));
  });

  it.each([
    ['offers the nickname pen in a conversation that is not blocked', false, true],
    ['hides the nickname pen from whoever did the blocking, since the server refuses the change', true, false],
  ])('%s', (_, blockedByMe, hasPen) => {
    Element.prototype.scrollIntoView = vi.fn();
    const ada = mockUser({ displayName: 'Ada' });
    const conversation = mockConversation({
      members: [ada, sessionUser as unknown as User],
      nicknames: [
        { user: ada.id, value: '' },
        { user: sessionUser.id, value: 'Ace' },
      ],
      ...(blockedByMe ? { status: 'BLOCKED', blocker: sessionUser.id } : {}),
    });
    messagePages = {
      pages: [
        {
          pageParam: 1,
          result: [mockMessage({ text: '', notice: { type: MessageNoticeType.NICKNAME, user: sessionUser.id, value: 'Ace' } })],
        },
      ],
    };

    renderWithQuery(<ConversationMessages conversation={conversation} />);

    expect(Boolean(screen.queryByRole('button', { name: 'Edit nickname' }))).toBe(hasPen);
  });

  it('resends a failed message with its text and photos in place of the failed copy', async () => {
    const photo = mockPhoto({ key: 'k1', url: 'https://utfs.io/a.png', width: 10, height: 20 });
    const failed = { ...mockMessage({ text: 'lost', conversation: 'c1', photos: [photo] }), failed: true };
    messagePages = { pages: [{ pageParam: 1, result: [failed] }] };

    renderWithQuery(<ConversationMessages conversation={mockConversation()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(sendMessage.mutate).toHaveBeenCalledWith({
      conversationId: 'c1',
      text: 'lost',
      photoInput: [{ id: photo.id, url: 'https://utfs.io/a.png', width: 10, height: 20 }],
      retryId: failed.id,
    });
  });

  it('renders nothing before messages load', () => {
    renderWithQuery(<ConversationMessages conversation={mockConversation()} />);

    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });
});

describe('ConversationMessageInput', () => {
  const user = () => userEvent.setup();

  it('tells you when you have been blocked', () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation({ status: 'BLOCKED', blocker: 'someone-else' })} />);

    expect(screen.getByText('You have been blocked')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Aa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unblock' })).not.toBeInTheDocument();
  });

  it('shows no blocked banner until the session has loaded', () => {
    sessionUser = undefined as never;

    const { container } = renderWithQuery(
      <ConversationMessageInput conversation={mockConversation({ status: 'BLOCKED', blocker: 'someone-else' })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  describe('when you blocked them', () => {
    const renderBlocked = () =>
      renderWithQuery(
        <ConversationMessageInput
          conversation={mockConversation({ id: 'c1', status: 'BLOCKED', blocker: sessionUser.id })}
        />,
      );

    it('says so and offers to unblock', () => {
      renderBlocked();

      expect(screen.getByText('You blocked this person')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Unblock' })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Aa')).not.toBeInTheDocument();
    });

    it('asks for confirmation before unblocking', async () => {
      renderBlocked();

      await user().click(screen.getByRole('button', { name: 'Unblock' }));

      expect(screen.getByRole('dialog', { name: 'Unblock this person?' })).toBeInTheDocument();
      expect(axiosInstance.delete).not.toHaveBeenCalled();
    });

    it('unblocks once confirmed and closes the prompt', async () => {
      renderBlocked();
      await user().click(screen.getByRole('button', { name: 'Unblock' }));

      await user().click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Unblock' }));

      expect(axiosInstance.delete).toHaveBeenCalledWith('/conversation/c1/block');
      await waitFor(() => expect(toast).toHaveBeenCalledWith('user unblocked'));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('does nothing when the prompt is cancelled', async () => {
      renderBlocked();
      await user().click(screen.getByRole('button', { name: 'Unblock' }));

      await user().click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(axiosInstance.delete).not.toHaveBeenCalled();
    });
  });

  it('sends a thumbs-up when there is nothing typed', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    const buttons = screen.getAllByRole('button');

    await user().click(buttons[buttons.length - 1]);

    expect(sendMessage.mutate).toHaveBeenCalledWith({ conversationId: 'c1', photoInput: [], text: '👍' });
  });

  it('sends the typed text on Enter and clears the box', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    const textarea = screen.getByPlaceholderText('Aa');

    await user().type(textarea, 'hello{Enter}');

    expect(sendMessageHookSpy).toHaveBeenLastCalledWith('');
    expect(sendMessage.mutate).toHaveBeenCalledWith({ conversationId: 'c1', photoInput: [], text: 'hello' });
    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  it('hands the typed text to the send hook', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);

    await user().type(screen.getByPlaceholderText('Aa'), 'hey');

    expect(sendMessageHookSpy).toHaveBeenLastCalledWith('hey');
  });

  it('adds a picked emoji to the text', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    const textarea = screen.getByPlaceholderText('Aa');
    await user().type(textarea, 'hi ');

    const buttons = screen.getAllByRole('button');
    await user().click(buttons.find((b) => b.querySelector('.lucide-smile'))!);
    await user().click(await screen.findByRole('button', { name: 'pick emoji' }));

    expect(textarea).toHaveValue('hi 😀');
  });

  it('attaches an uploaded photo and sends it, even without text', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);

    await user().click(screen.getAllByRole('button', { name: 'upload photo' })[0]);
    expect(await screen.findByRole('img', { name: 'image' })).toHaveAttribute('src', UPLOADED_PHOTO.photo.url);

    await user().type(screen.getByPlaceholderText('Aa'), '{Enter}');

    expect(sendMessage.mutate).toHaveBeenCalledWith({
      conversationId: 'c1',
      text: '',
      photoInput: [{ id: UPLOADED_PHOTO.photo.id, url: UPLOADED_PHOTO.photo.url, width: 640, height: 480 }],
    });
    await waitFor(() => expect(screen.queryByRole('img', { name: 'image' })).not.toBeInTheDocument());
  });

  it('removes an attached photo through the server', async () => {
    stubImageLoading();
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    await user().click(screen.getAllByRole('button', { name: 'upload photo' })[0]);
    const image = await screen.findByRole('img', { name: 'image' });

    await user().click(image.parentElement!.querySelector('button')!);

    expect(axiosInstance.delete).toHaveBeenCalledWith(`/upload/${UPLOADED_PHOTO.photo.id}`);
    await waitFor(() => expect(screen.queryByRole('img', { name: 'image' })).not.toBeInTheDocument());
  });

  it('keeps the photo and explains when it cannot be removed', async () => {
    vi.mocked(axiosInstance.delete).mockRejectedValueOnce(
      new AxiosError('404', undefined, undefined, undefined, {
        status: 404,
        data: { status: 'NOT_FOUND', message: 'could not delete', data: null },
      } as never),
    );
    stubImageLoading();
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    await user().click(screen.getAllByRole('button', { name: 'upload photo' })[0]);
    const image = await screen.findByRole('img', { name: 'image' });

    await user().click(image.parentElement!.querySelector('button')!);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('could not delete'));
    expect(screen.getByRole('img', { name: 'image' })).toBeInTheDocument();
  });

  it('attaches nothing when the server saved no photo', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);

    await user().click(screen.getAllByRole('button', { name: 'upload photo without result' })[0]);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
    expect(screen.queryByRole('img', { name: 'image' })).not.toBeInTheDocument();
  });

  it('shows an upload error', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);

    await user().click(screen.getAllByRole('button', { name: 'fail upload' })[0]);

    expect(toast.error).toHaveBeenCalledWith('upload failed');
  });
});

describe('MessageToast', () => {
  function payload(overrides: Partial<MessagePayload> = {}): MessagePayload {
    const sender = mockUser({ displayName: 'Bob' });
    return {
      ...mockMessage({ sender, text: 'are you there?' }),
      conversation: { id: 'c9', nicknames: [] },
      ...overrides,
    } as MessagePayload;
  }

  it("shows the sender's name and the message", () => {
    renderWithQuery(<MessageToast message={payload()} toastId="t" />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('are you there?')).toBeInTheDocument();
  });

  it("uses the sender's nickname in that conversation", () => {
    const message = payload();
    message.conversation.nicknames = [{ user: message.sender.id, value: 'Bobby' }];

    renderWithQuery(<MessageToast message={message} toastId="t" />);

    expect(screen.getByText('Bobby')).toBeInTheDocument();
  });

  it('summarises several photos', () => {
    renderWithQuery(<MessageToast message={payload({ photos: [mockPhoto(), mockPhoto()] })} toastId="t" />);

    expect(screen.getByText('Sent some photos')).toBeInTheDocument();
  });

  it('previews a single photo', () => {
    const photo = mockPhoto({ url: 'https://utfs.io/one.png' });

    const { container } = renderWithQuery(<MessageToast message={payload({ photos: [photo] })} toastId="t" />);

    expect(container.querySelector(`img[src="${photo.url}"]`)).toBeInTheDocument();
  });

  it('can be dismissed', async () => {
    renderWithQuery(<MessageToast message={payload()} toastId="t" />);

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(toast.dismiss).toHaveBeenCalledWith('t');
  });

  it('replies with a thumbs-up', async () => {
    renderWithQuery(<MessageToast message={payload()} toastId="t" />);
    const buttons = screen.getAllByRole('button');

    await userEvent.click(buttons[buttons.length - 1]);

    expect(sendMessage.mutate).toHaveBeenCalledWith({ text: '👍', conversationId: 'c9', photoInput: [] });
  });

  it('replies with typed text on Enter, ignoring blank text', async () => {
    renderWithQuery(<MessageToast message={payload()} toastId="t" />);
    const reply = screen.getByPlaceholderText('reply');

    await userEvent.type(reply, '   {Enter}');
    expect(sendMessage.mutate).not.toHaveBeenCalled();

    await userEvent.clear(reply);
    await userEvent.type(reply, 'yes{Enter}');
    expect(sendMessageHookSpy).toHaveBeenLastCalledWith('yes');
    expect(sendMessage.mutate).toHaveBeenCalledWith({ text: '', conversationId: 'c9', photoInput: [] });
  });

  it('keeps a line break on Shift+Enter', async () => {
    renderWithQuery(<MessageToast message={payload()} toastId="t" />);
    const reply = screen.getByPlaceholderText('reply');

    await userEvent.type(reply, 'a{Shift>}{Enter}{/Shift}b');

    expect(reply).toHaveValue('a\nb');
    expect(sendMessage.mutate).not.toHaveBeenCalled();
  });

  it('sends with the send button once text is typed', async () => {
    renderWithQuery(<MessageToast message={payload()} toastId="t" />);
    await userEvent.type(screen.getByPlaceholderText('reply'), 'ok');
    const buttons = screen.getAllByRole('button');

    await act(() => userEvent.click(buttons[buttons.length - 1]));

    expect(sendMessage.mutate).toHaveBeenCalledWith({ text: '', conversationId: 'c9', photoInput: [] });
  });
});
