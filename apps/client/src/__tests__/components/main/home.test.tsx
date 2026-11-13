import { mockConversation, mockMessage, mockPhoto, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import HomeActiveConversations from '@/components/page/main/home/HomeActiveConversation';
import HomeConversation from '@/components/page/main/home/HomeConversation';
import HomeConversations from '@/components/page/main/home/HomeConversations';
import HomeSideBarMobileHeader from '@/components/page/main/home/HomeSideBarMobileHeader';
import MainContent from '@/components/page/main/MainContent';
import Aside from '@/components/page/main/SideBar/Aside';
import ConversationSideBar from '@/components/page/main/SideBar/ConversationSideBar';
import SideBar from '@/components/page/main/SideBar/SideBar';
import UserSideBar from '@/components/page/main/SideBar/UserSidebar';
import SidebarContent from '@/components/page/main/SidebarContent';
import UserAvatar from '@/components/page/main/UserAvatar';
import { UserStatus } from '@repo/enums';
import type { Conversation, UserSession } from '@repo/types';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let sessionUser: UserSession;
const logout = vi.fn();
vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({ session: { user: sessionUser }, logout }),
}));

const push = vi.fn();
let pathname = '/';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => pathname }));

let onMobile = false;
vi.mock('@/components/hooks/useUserAgent', () => ({ default: () => ({ onMobile }) }));

const active = {
  activeConversations: [] as Conversation[] | undefined,
  isError: false,
  isLoading: false,
  isRefetching: false,
  refetch: vi.fn(),
};
vi.mock('@/components/hooks/queries/useActiveConversation', () => ({ default: () => active }));

let conversations: Conversation[] = [];
vi.mock('@/components/hooks/queries/useConversations', () => ({ default: () => ({ conversations }) }));

let searchResults: Conversation[] | undefined;
const searchSpy = vi.fn();
vi.mock('@/components/hooks/queries/useSearchConversations', () => ({
  default: (text: string) => {
    searchSpy(text);
    return { data: searchResults };
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser = mockSession({ displayName: 'Me', userName: '@me' });
  pathname = '/';
  onMobile = false;
  Object.assign(active, { activeConversations: [], isError: false, isLoading: false, isRefetching: false });
  conversations = [];
  searchResults = undefined;
});

/** A one-to-one conversation whose last message is `text`, sent by `sender`. */
function chatWith(other = mockUser({ displayName: 'Bob' }), lastMessage: Parameters<typeof mockMessage>[0] = {}) {
  return mockConversation({
    members: [other],
    messages: [mockMessage({ sender: other, text: 'hello', seenBy: [], ...lastMessage }) as never],
  });
}

describe('UserAvatar', () => {
  it('shows a green dot only when online', () => {
    const { container, rerender } = render(<UserAvatar isOnline />);
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();

    rerender(<UserAvatar isOnline={false} />);
    expect(container.querySelector('.bg-green-500')).not.toBeInTheDocument();
  });
});

describe('layout wrappers', () => {
  it('MainContent and SidebarContent render their children with extra classes', () => {
    render(
      <>
        <MainContent className="main-extra">main child</MainContent>
        <SidebarContent className="side-extra">side child</SidebarContent>
      </>,
    );

    expect(screen.getByText('main child')).toHaveClass('main-extra');
    expect(screen.getByText('side child')).toHaveClass('side-extra');
  });

  it('SideBar renders an empty section', () => {
    const { container } = render(<SideBar />);

    expect(container.querySelector('section')).toBeEmptyDOMElement();
  });
});

describe('HomeConversation', () => {
  it("shows the other person's name, the last message and links to the conversation", () => {
    const conversation = chatWith();

    renderWithQuery(<HomeConversation conversation={conversation} />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', `/conversation/${conversation.id}`);
  });

  it('prefers their nickname', () => {
    const bob = mockUser({ displayName: 'Bob' });
    const conversation = chatWith(bob);
    conversation.nicknames = [{ user: bob.id, value: 'Bobby' }];

    renderWithQuery(<HomeConversation conversation={conversation} />);

    expect(screen.getByText('Bobby')).toBeInTheDocument();
  });

  it('prefixes your own last message with "you:"', () => {
    renderWithQuery(<HomeConversation conversation={chatWith(undefined, { sender: sessionUser as never, text: 'bye' })} />);

    expect(screen.getByText('you: bye')).toBeInTheDocument();
  });

  it('names the sender in a group chat', () => {
    const carol = mockUser({ displayName: 'Carol' });
    const conversation = mockConversation({
      name: 'Team',
      members: [mockUser(), carol],
      messages: [mockMessage({ sender: carol, text: 'standup?', seenBy: [] }) as never],
    });

    renderWithQuery(<HomeConversation conversation={conversation} />);

    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Carol: standup?')).toBeInTheDocument();
  });

  it('says "you" for your own message in a group chat', () => {
    const conversation = mockConversation({
      name: 'Team',
      members: [mockUser(), mockUser()],
      messages: [mockMessage({ sender: sessionUser as never, text: 'on it', seenBy: [] }) as never],
    });

    renderWithQuery(<HomeConversation conversation={conversation} />);

    expect(screen.getByText('you: on it')).toBeInTheDocument();
  });

  it.each([
    [1, 'sent a photo'],
    [3, 'sent some photos'],
  ])('describes %i photo(s)', (count, text) => {
    const photos = Array.from({ length: count }, () => mockPhoto());

    renderWithQuery(<HomeConversation conversation={chatWith(undefined, { photos, text: '' })} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('marks an unread message from someone else', () => {
    const { container } = renderWithQuery(<HomeConversation conversation={chatWith()} />);

    expect(container.querySelector('span.bg-primary.rounded-full')).toBeInTheDocument();
    expect(screen.getByText('hello').parentElement).toHaveClass('font-semibold');
  });

  it('does not mark a message you have seen', () => {
    const conversation = chatWith(undefined, { seenBy: [{ id: sessionUser.id }] as never });

    const { container } = renderWithQuery(<HomeConversation conversation={conversation} />);

    expect(container.querySelector('span.bg-primary.rounded-full')).not.toBeInTheDocument();
  });

  it('does not mark your own message', () => {
    const { container } = renderWithQuery(
      <HomeConversation conversation={chatWith(undefined, { sender: sessionUser as never })} />,
    );

    expect(container.querySelector('span.bg-primary.rounded-full')).not.toBeInTheDocument();
  });

  it('highlights the conversation that is open', () => {
    const conversation = chatWith();
    pathname = `/conversation/${conversation.id}`;

    renderWithQuery(<HomeConversation conversation={conversation} />);

    expect(screen.getByRole('link')).toHaveClass('bg-muted');
  });

  it('shows the online dot when a member is online', () => {
    const { container } = renderWithQuery(
      <HomeConversation conversation={chatWith(mockUser({ status: UserStatus.ONLINE }))} />,
    );

    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });
});

describe('HomeConversations', () => {
  it('lists the conversations', () => {
    conversations = [chatWith(mockUser({ displayName: 'Bob' })), chatWith(mockUser({ displayName: 'Ann' }))];

    renderWithQuery(<HomeConversations />);

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Ann')).toBeInTheDocument();
  });

  it('shows search results instead while searching', async () => {
    conversations = [chatWith(mockUser({ displayName: 'Bob' }))];
    const { rerender } = renderWithQuery(<HomeConversations />);

    await userEvent.type(screen.getByPlaceholderText('Search'), 'an');
    expect(searchSpy).toHaveBeenLastCalledWith('an');

    searchResults = [chatWith(mockUser({ displayName: 'Ann' }))];
    rerender(<HomeConversations />);

    expect(screen.getByText('Ann')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('opens the compose page', async () => {
    renderWithQuery(<HomeConversations />);

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(push).toHaveBeenCalledWith('/compose');
  });
});

describe('HomeActiveConversations', () => {
  it('shows placeholders while loading', () => {
    active.isLoading = true;

    const { container } = render(<HomeActiveConversations />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('says when nobody is active', () => {
    render(<HomeActiveConversations />);

    expect(screen.getByText('No active friends')).toBeInTheDocument();
  });

  it('offers a retry after a failure', async () => {
    active.isError = true;

    render(<HomeActiveConversations />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(active.refetch).toHaveBeenCalledOnce();
  });

  it('links to each active conversation by person or group name', () => {
    const one = chatWith(mockUser({ displayName: 'Bob' }));
    const group = mockConversation({ name: 'Team', members: [mockUser(), mockUser()] });
    active.activeConversations = [one, group];

    render(<HomeActiveConversations />);

    expect(screen.getByRole('link', { name: /Bob/ })).toHaveAttribute('href', `/conversation/${one.id}`);
    expect(screen.getByRole('link', { name: /Team/ })).toHaveAttribute('href', `/conversation/${group.id}`);
    expect(screen.queryByText('see more')).not.toBeInTheDocument();
  });

  it('offers "see more" past six', () => {
    active.activeConversations = Array.from({ length: 7 }, () => chatWith());

    render(<HomeActiveConversations />);

    expect(screen.getByText('see more')).toBeInTheDocument();
  });
});

describe('ConversationSideBar', () => {
  it('shows the active and all conversations', async () => {
    renderWithQuery(<ConversationSideBar />);

    expect(await screen.findByText('Active Conversations')).toBeInTheDocument();
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('is hidden on mobile away from home', () => {
    onMobile = true;
    pathname = '/conversation/c1';

    const { container } = renderWithQuery(<ConversationSideBar />);

    expect(container).toBeEmptyDOMElement();
  });

  it('can be collapsed from the Home button', async () => {
    const { queryClient } = renderWithQuery(
      <>
        <Aside />
        <ConversationSideBar />
      </>,
    );
    await waitFor(() => expect(queryClient.getQueryData(['home', 'sidebar'])).toBe(true));

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(queryClient.getQueryData(['home', 'sidebar'])).toBe(false);
  });
});

describe('Aside', () => {
  it('goes home from anywhere else', async () => {
    pathname = '/settings';
    renderWithQuery(<Aside />);

    await userEvent.click(screen.getAllByRole('button')[0]);

    expect(push).toHaveBeenCalledWith('/');
  });
});

describe('UserSideBar', () => {
  it('shows who you are and opens settings', async () => {
    render(<UserSideBar />);

    await userEvent.click(screen.getByRole('button'));
    const menu = await screen.findByRole('menu');

    expect(within(menu).getByText('Me')).toBeInTheDocument();
    expect(within(menu).getByText('@me')).toBeInTheDocument();
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Settings' }));
    expect(push).toHaveBeenCalledWith('/settings');
  });

  it('logs out', async () => {
    render(<UserSideBar />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Logout' }));

    expect(logout).toHaveBeenCalledOnce();
  });
});

describe('HomeSideBarMobileHeader', () => {
  it('opens a menu with your profile, settings and logout', async () => {
    renderWithQuery(<HomeSideBarMobileHeader />);

    await userEvent.click(screen.getAllByRole('button')[0]);
    const sheet = await screen.findByRole('dialog');

    expect(within(sheet).getByText('Me')).toBeInTheDocument();
    expect(within(sheet).getByText('@me')).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Settings' }));
    expect(push).toHaveBeenCalledWith('/settings');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Logout' }));
    expect(logout).toHaveBeenCalledOnce();
  });

  it('opens the compose page', async () => {
    renderWithQuery(<HomeSideBarMobileHeader />);

    await userEvent.click(screen.getAllByRole('button')[1]);

    expect(push).toHaveBeenCalledWith('/compose');
  });
});
