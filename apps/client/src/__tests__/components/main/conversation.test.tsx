import { stubImageLoading, stubPhotoDelete, UPLOADED_FILE } from '@/__tests__/mocks/mock-components';
import { mockConversation, mockMessage, mockPhoto, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import ConversationHeader from '@/components/page/main/conversation/ConversationHeader';
import ConversationMessage from '@/components/page/main/conversation/ConversationMessage';
import ConversationMessageInput from '@/components/page/main/conversation/ConversationMessageInput';
import ConversationMessages from '@/components/page/main/conversation/ConversationMessages';
import MessageToast from '@/components/page/main/conversation/MessageToast';
import { axiosInstance } from '@/lib/axios-instance';
import { UserStatus } from '@repo/enums';
import type { Message, MessagePayload, UserSession } from '@repo/types';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/page/UploadthingButton', async () => (await import('@/__tests__/mocks/mock-components')).uploadthingModule);
vi.mock('emoji-picker-react', async () => (await import('@/__tests__/mocks/mock-components')).emojiPickerModule);
vi.mock('next/image', async () => (await import('@/__tests__/mocks/mock-components')).nextImageModule);
vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { patch: vi.fn().mockResolvedValue({}) } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), dismiss: vi.fn() } }));

let sessionUser: UserSession;
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session: { user: sessionUser } }) }));

const socket = { emit: vi.fn() };
vi.mock('@/components/providers/SocketIOProvider', () => ({ useSocketIO: () => socket }));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), useParams: () => ({ id: 'c1' }) }));

const sidebar = { onMobile: false, setIsOpen: vi.fn() };
vi.mock('@/components/hooks/queries/useInfoSidebarOpen', () => ({ default: () => sidebar }));

const sendMessage = { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
const sendMessageHookSpy = vi.fn((_text: string) => ({ sendMessage }));
vi.mock('@/components/hooks/mutation/useSendMessage.mutation', () => ({ default: (text: string) => sendMessageHookSpy(text) }));

let messagePages: { pages: { pageParam: number; result: Message[] }[] } | undefined;
vi.mock('@/components/hooks/queries/useMessages', () => ({ default: () => ({ foundMessages: messagePages }) }));

beforeEach(() => {
  vi.clearAllMocks();
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
  const info = { photoUrl: '', conversationName: 'Bob', status: UserStatus.ONLINE, lastOnline: '' };

  it('shows the conversation name', () => {
    renderWithQuery(<ConversationHeader conversationInfo={info} />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows the online dot only for someone online', () => {
    const { container, rerender } = renderWithQuery(<ConversationHeader conversationInfo={info} />);
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();

    rerender(<ConversationHeader conversationInfo={{ ...info, status: UserStatus.OFFLINE, lastOnline: '5 minute(s) ago' }} />);
    expect(container.querySelector('.bg-green-500')).not.toBeInTheDocument();
    expect(screen.getByText('5 minute(s) ago')).toBeInTheDocument();
  });

  it('rings the conversation and opens the call', async () => {
    renderWithQuery(<ConversationHeader conversationInfo={info} />);

    await userEvent.click(screen.getByRole('button', { name: 'Start video call' }));

    expect(socket.emit).toHaveBeenCalledWith('CALL', { conversationId: 'c1' });
    expect(push).toHaveBeenCalledWith('/call/c1');
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
    expect(container.querySelector('.grid-cols-\\[auto_1fr\\]')).toBeInTheDocument();
  });

  it('only shows the avatar on the last of a quick run of messages', () => {
    const prev = message({ dateCreated: at(30) });
    const next = message({ dateCreated: at(5) });

    const { container } = renderWithQuery(
      <ConversationMessage message={message({ dateCreated: at(20) })} prevMessage={prev} nextMessage={next} isLastMessage={false} />,
    );

    expect(container.querySelector('.opacity-0')).toBeInTheDocument();
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

  it('does not mark earlier messages as seen', () => {
    renderWithQuery(<ConversationMessage message={message()} isLastMessage={false} />);

    expect(axiosInstance.patch).not.toHaveBeenCalled();
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

  it('renders nothing before messages load', () => {
    renderWithQuery(<ConversationMessages conversation={mockConversation()} />);

    expect(screen.queryByText(/./)).not.toBeInTheDocument();
  });
});

describe('ConversationMessageInput', () => {
  const user = () => userEvent.setup();

  it('says you cannot reply in a blocked conversation', () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation({ status: 'BLOCKED' })} />);

    expect(screen.getByText('You are unable to reply on this conversation')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Aa')).not.toBeInTheDocument();
  });

  it('sends a thumbs-up when there is nothing typed', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    const buttons = screen.getAllByRole('button');

    await user().click(buttons[buttons.length - 1]);

    expect(sendMessage.mutateAsync).toHaveBeenCalledWith({ conversationId: 'c1', photoInput: [], text: '👍' });
  });

  it('sends the typed text on Enter and clears the box', async () => {
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    const textarea = screen.getByPlaceholderText('Aa');

    await user().type(textarea, 'hello{Enter}');

    expect(sendMessageHookSpy).toHaveBeenLastCalledWith('');
    expect(sendMessage.mutateAsync).toHaveBeenCalledWith({ conversationId: 'c1', photoInput: [], text: '' });
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
    expect(await screen.findByRole('img', { name: 'image' })).toHaveAttribute('src', UPLOADED_FILE.url);

    await user().type(screen.getByPlaceholderText('Aa'), '{Enter}');

    expect(sendMessage.mutateAsync).toHaveBeenCalledWith({
      conversationId: 'c1',
      text: '',
      photoInput: [{ ...UPLOADED_FILE, width: 640, height: 480 }],
    });
    await waitFor(() => expect(screen.queryByRole('img', { name: 'image' })).not.toBeInTheDocument());
  });

  it('removes an attached photo through the delete route', async () => {
    const fetchMock = stubPhotoDelete();
    stubImageLoading();
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    await user().click(screen.getAllByRole('button', { name: 'upload photo' })[0]);
    const image = await screen.findByRole('img', { name: 'image' });

    await user().click(image.parentElement!.querySelector('button')!);

    expect(fetchMock).toHaveBeenCalledWith('/api/photo', expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ key: UPLOADED_FILE.key }) }));
    await waitFor(() => expect(screen.queryByRole('img', { name: 'image' })).not.toBeInTheDocument());
  });

  it('keeps the photo and explains when it cannot be removed', async () => {
    stubPhotoDelete({ status: 'INTERNAL_SERVER_ERROR', message: 'could not delete' });
    stubImageLoading();
    renderWithQuery(<ConversationMessageInput conversation={mockConversation()} />);
    await user().click(screen.getAllByRole('button', { name: 'upload photo' })[0]);
    const image = await screen.findByRole('img', { name: 'image' });

    await user().click(image.parentElement!.querySelector('button')!);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('could not delete'));
    expect(screen.getByRole('img', { name: 'image' })).toBeInTheDocument();
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
