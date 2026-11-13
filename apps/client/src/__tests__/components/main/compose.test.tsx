import { stubImageLoading, stubPhotoDelete, UPLOADED_FILE } from '@/__tests__/mocks/mock-components';
import { mockConversation, mockMessage, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { makeQueryClient } from '@/__tests__/mocks/MockQueryClientProvider';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import ComposePage from '@/app/(main)/(home)/compose/page';
import ComposeFoundMessages from '@/components/page/main/compose/ComposeFoundMessages';
import ComposeMessageInput from '@/components/page/main/compose/ComposeMessageInput';
import ComposeTo from '@/components/page/main/compose/ComposeTo';
import { COMPOSE_SELECTED_USERS_QUERY_KEY } from '@repo/constants';
import { ConversationStatus } from '@repo/enums';
import type { Conversation, Message, User, UserSession } from '@repo/types';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/page/UploadthingButton', async () => (await import('@/__tests__/mocks/mock-components')).uploadthingModule);
vi.mock('emoji-picker-react', async () => (await import('@/__tests__/mocks/mock-components')).emojiPickerModule);
vi.mock('next/image', async () => (await import('@/__tests__/mocks/mock-components')).nextImageModule);
vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { patch: vi.fn().mockResolvedValue({}) } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));

let sessionUser: UserSession;
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session: { user: sessionUser } }) }));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

let searchResult: User[] = [];
vi.mock('@/components/hooks/queries/useSearchUsers', () => ({ default: () => ({ data: searchResult }) }));

let foundConversations: Conversation[] = [];
let foundIsError = false;
vi.mock('@/components/hooks/queries/useSearchConversationsByMember', () => ({
  default: () => ({ foundConversations, isError: foundIsError }),
}));

let foundConversation: Conversation | undefined;
vi.mock('@/components/hooks/queries/useConversation', () => ({ default: () => ({ data: foundConversation }) }));

let messagePages: { pages: { pageParam: number; result: Message[] }[] } | undefined;
let messagesError = false;
vi.mock('@/components/hooks/queries/useMessages', () => ({
  default: () => ({ foundMessages: messagePages, isError: messagesError }),
}));

const sendMessage = { mutate: vi.fn(), isPending: false };
const composeSpy = vi.fn((_options: unknown) => ({ sendMessage }));
vi.mock('@/components/hooks/mutation/useComposeMessage.mutation', () => ({
  default: (options: unknown) => composeSpy(options),
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser = mockSession();
  searchResult = [];
  foundConversations = [];
  foundIsError = false;
  foundConversation = undefined;
  messagePages = undefined;
  messagesError = false;
  sendMessage.isPending = false;
  Element.prototype.scrollIntoView = vi.fn();
  stubImageLoading();
});
afterEach(() => vi.unstubAllGlobals());

/** ComposeTo with real selection state, exposing it for assertions. */
function ComposeToHarness({ initial = [] as string[][], onChange }: { initial?: string[][]; onChange?: (s: string[][]) => void }) {
  const [selected, setSelected] = useState<string[][]>(initial);
  onChange?.(selected);
  return <ComposeTo selectedUsers={selected} setSelectedUsers={setSelected} />;
}

function selection(count: number) {
  return Array.from({ length: count }, (_, i) => [`u${i + 1}`, `Person ${i + 1}`]);
}

describe('ComposeTo', () => {
  it('searches for people and adds the one picked', async () => {
    const bob = mockUser({ displayName: 'Bob', userName: '@bob' });
    searchResult = [bob];
    let selected: string[][] = [];
    renderWithQuery(<ComposeToHarness onChange={(s) => (selected = s)} />);
    const input = screen.getByLabelText('To:');

    await userEvent.type(input, 'bo');
    await userEvent.click(screen.getByRole('button', { name: /Bob @bob/ }));

    expect(selected).toEqual([[bob.id, 'Bob']]);
    expect(input).toHaveValue('');
    // The results list stays mounted (hidden with CSS), so look for the chip itself.
    expect(screen.getAllByText('Bob').some((el) => el.classList.contains('max-w-32'))).toBe(true);
  });

  it('refuses to add the same person twice', async () => {
    const bob = mockUser({ displayName: 'Bob', userName: '@bob' });
    searchResult = [bob];
    let selected: string[][] = [];
    renderWithQuery(<ComposeToHarness initial={[[bob.id, 'Bob']]} onChange={(s) => (selected = s)} />);

    await userEvent.click(screen.getByLabelText('To:'));
    await userEvent.click(screen.getByRole('button', { name: /Bob @bob/ }));

    expect(toast).toHaveBeenCalledWith('Already selected');
    expect(selected).toHaveLength(1);
  });

  it('lets two different people with the same name both be added', async () => {
    const otherBob = mockUser({ displayName: 'Bob', userName: '@bob2' });
    searchResult = [otherBob];
    let selected: string[][] = [];
    renderWithQuery(<ComposeToHarness initial={[['first-bob', 'Bob']]} onChange={(s) => (selected = s)} />);

    await userEvent.click(screen.getByLabelText('To:'));
    await userEvent.click(screen.getByRole('button', { name: /Bob @bob2/ }));

    expect(selected).toEqual([
      ['first-bob', 'Bob'],
      [otherBob.id, 'Bob'],
    ]);
  });

  it('removes a selected person', async () => {
    let selected: string[][] = [];
    renderWithQuery(<ComposeToHarness initial={selection(2)} onChange={(s) => (selected = s)} />);

    const chip = screen.getByText('Person 1').parentElement!;
    await userEvent.click(within(chip).getByRole('button'));

    expect(selected).toEqual([['u2', 'Person 2']]);
  });

  it('removes the right person when more than five are selected', async () => {
    let selected: string[][] = [];
    renderWithQuery(<ComposeToHarness initial={selection(7)} onChange={(s) => (selected = s)} />);

    // Only the last five are shown as chips; remove "Person 3", the first visible one.
    expect(screen.queryByText('Person 1')).not.toBeInTheDocument();
    const chip = screen.getByText('Person 3').parentElement!;
    await userEvent.click(within(chip).getByRole('button'));

    expect(selected.map(([id]) => id)).toEqual(['u1', 'u2', 'u4', 'u5', 'u6', 'u7']);
  });

  it('lists the people beyond the first five in a dropdown, and removes them from there', async () => {
    let selected: string[][] = [];
    renderWithQuery(<ComposeToHarness initial={selection(7)} onChange={(s) => (selected = s)} />);

    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons.find((b) => b.querySelector('.lucide-chevron-down'))!);
    const menu = await screen.findByRole('menu');
    const hidden = within(menu).getByText('Person 1').parentElement!;
    await userEvent.click(within(hidden).getByRole('button'));

    expect(selected.map(([id]) => id)).toEqual(['u2', 'u3', 'u4', 'u5', 'u6', 'u7']);
  });

  it('points out group chats these people already share', async () => {
    foundConversations = [
      mockConversation({ name: 'Team', members: [mockUser(), mockUser()] }),
      mockConversation({ name: 'Friends', members: [mockUser(), mockUser()] }),
    ];
    renderWithQuery(<ComposeToHarness initial={selection(2)} />);

    expect(screen.getByText('2 group chat(s)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'see list' }));
    await userEvent.click(screen.getByRole('button', { name: 'Team' }));

    expect(push).toHaveBeenCalledWith(`/conversation/${foundConversations[0].id}`);
  });

  it('does not mention a one-to-one conversation as a group chat', () => {
    foundConversations = [mockConversation()];

    renderWithQuery(<ComposeToHarness initial={selection(1)} />);

    expect(screen.queryByText(/group chat/)).not.toBeInTheDocument();
  });
});

describe('ComposeMessageInput', () => {
  it('renders nothing until someone is selected', () => {
    const { container } = renderWithQuery(<ComposeMessageInput selectedUsers={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('sends a first message to the selected people', async () => {
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(2)} />);

    await userEvent.type(screen.getByPlaceholderText('Aa'), 'hello{Enter}');

    expect(sendMessage.mutate).toHaveBeenCalledWith({ conversationId: undefined, text: 'hello', members: ['u1', 'u2'] });
    expect(screen.getByPlaceholderText('Aa')).toHaveValue('');
  });

  it('sends into the conversation they already share', async () => {
    foundConversations = [mockConversation({ id: 'existing' } as Partial<Conversation>)];
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);

    await userEvent.type(screen.getByPlaceholderText('Aa'), 'hi{Enter}');

    expect(sendMessage.mutate).toHaveBeenCalledWith({ conversationId: 'existing', text: 'hi', members: ['u1'] });
  });

  it('sends a thumbs-up with nothing typed', async () => {
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);
    const buttons = screen.getAllByRole('button');

    await userEvent.click(buttons[buttons.length - 1]);

    expect(sendMessage.mutate).toHaveBeenCalledWith(expect.objectContaining({ text: '👍' }));
  });

  it('sends with the send button once text is typed', async () => {
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);
    await userEvent.type(screen.getByPlaceholderText('Aa'), 'yo');
    const buttons = screen.getAllByRole('button');

    await userEvent.click(buttons[buttons.length - 1]);

    expect(sendMessage.mutate).toHaveBeenCalledWith(expect.objectContaining({ text: 'yo' }));
  });

  it('adds a picked emoji to the text', async () => {
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);
    const buttons = screen.getAllByRole('button');

    await userEvent.click(buttons.find((b) => b.querySelector('.lucide-smile'))!);
    await userEvent.click(await screen.findByRole('button', { name: 'pick emoji' }));

    expect(screen.getByPlaceholderText('Aa')).toHaveValue('😀');
  });

  it('attaches uploaded photos to the message', async () => {
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'upload photo' })[0]);

    expect(await screen.findByRole('img', { name: 'image' })).toHaveAttribute('src', UPLOADED_FILE.url);
    await waitFor(() =>
      expect(composeSpy).toHaveBeenLastCalledWith({ photos: [{ ...UPLOADED_FILE, width: 640, height: 480 }] }),
    );
  });

  it('removes an attached photo', async () => {
    const fetchMock = stubPhotoDelete();
    stubImageLoading();
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'upload photo' })[0]);
    const image = await screen.findByRole('img', { name: 'image' });

    await userEvent.click(image.parentElement!.querySelector('button')!);

    expect(fetchMock).toHaveBeenCalledWith('/api/photo', expect.objectContaining({ method: 'DELETE' }));
    await waitFor(() => expect(screen.queryByRole('img', { name: 'image' })).not.toBeInTheDocument());
  });

  it('shows an upload error', async () => {
    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'fail upload' })[0]);

    expect(toast.error).toHaveBeenCalledWith('upload failed');
  });

  it('tells you when you blocked the conversation', () => {
    foundConversation = mockConversation({ status: ConversationStatus.BLOCKED, blocker: sessionUser.id });

    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);

    expect(screen.getByText(/You have blocked this user/)).toBeInTheDocument();
  });

  it('tells you when the other person blocked the conversation', () => {
    foundConversation = mockConversation({ status: ConversationStatus.BLOCKED, blocker: 'someone-else' });

    renderWithQuery(<ComposeMessageInput selectedUsers={selection(1)} />);

    expect(screen.getByText('You are unable to reply on this conversation')).toBeInTheDocument();
  });
});

describe('ComposeFoundMessages', () => {
  it('shows the messages of the conversation these people already share', () => {
    messagePages = { pages: [{ pageParam: 1, result: [mockMessage({ text: 'earlier chat' })] }] };

    renderWithQuery(<ComposeFoundMessages selectedUsers={selection(1)} />);

    expect(screen.getByText('earlier chat')).toBeInTheDocument();
  });

  it('offers a reload when messages cannot be loaded', () => {
    messagesError = true;

    renderWithQuery(<ComposeFoundMessages selectedUsers={selection(1)} />);

    expect(screen.getByText("Can't load messages")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });
});

describe('Compose page', () => {
  it('composes to the people chosen in the To field', async () => {
    const bob = mockUser({ displayName: 'Bob', userName: '@bob' });
    searchResult = [bob];
    renderWithQuery(<ComposePage />);

    expect(screen.queryByPlaceholderText('Aa')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('To:'), 'b');
    await userEvent.click(screen.getByRole('button', { name: /Bob @bob/ }));
    await userEvent.type(screen.getByPlaceholderText('Aa'), 'hi{Enter}');

    expect(sendMessage.mutate).toHaveBeenCalledWith({ conversationId: undefined, text: 'hi', members: [bob.id] });
  });

  it('starts with recipients handed over by another screen, only once', () => {
    const queryClient = makeQueryClient();
    queryClient.setQueryData(COMPOSE_SELECTED_USERS_QUERY_KEY, [['u9', 'Zoe']]);

    const first = renderWithQuery(<ComposePage />, queryClient);

    expect(screen.getAllByText('Zoe').some((el) => el.classList.contains('max-w-32'))).toBe(true);
    expect(queryClient.getQueryData(COMPOSE_SELECTED_USERS_QUERY_KEY)).toBeUndefined();

    first.unmount();
    renderWithQuery(<ComposePage />, queryClient);
    expect(screen.queryByText('Zoe')).not.toBeInTheDocument();
  });
});
