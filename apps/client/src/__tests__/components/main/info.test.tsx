import { stubPhotoDelete, UPLOADED_FILE } from '@/__tests__/mocks/mock-components';
import { mockConversation, mockMessage, mockPhoto, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { makeQueryClient } from '@/__tests__/mocks/MockQueryClientProvider';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import Admins from '@/components/page/main/info/admin-and-members/Admins';
import ManageAdmin from '@/components/page/main/info/admin-and-members/ManageAdmin';
import ManageMember from '@/components/page/main/info/admin-and-members/ManageMember';
import Members from '@/components/page/main/info/admin-and-members/Members';
import AddNickname from '@/components/page/main/info/customization/AddNickname';
import ChangeName from '@/components/page/main/info/customization/ChangeName';
import ChangePhoto from '@/components/page/main/info/customization/ChangePhoto';
import InfoAdminsAndMembers from '@/components/page/main/info/InfoAdminsAndMembers';
import InfoCustomization from '@/components/page/main/info/InfoCustomization';
import InfoMedia from '@/components/page/main/info/InfoMedia';
import InfoPrivacyAndSupport from '@/components/page/main/info/InfoPrivacyAndSupport';
import InfoSidebar from '@/components/page/main/info/InfoSidebar';
import UserInfoDialog from '@/components/page/main/info/UserInfoDialog';
import { axiosInstance } from '@/lib/axios-instance';
import { GETRequest, PATCHRequest } from '@/lib/server/requests';
import { COMPOSE_SELECTED_USERS_QUERY_KEY, SOMETHING_WENT_WRONG } from '@repo/constants';
import { ConversationStatus, UserStatus } from '@repo/enums';
import type { Conversation, User, UserSession } from '@repo/types';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/page/UploadthingButton', async () => (await import('@/__tests__/mocks/mock-components')).uploadthingModule);
vi.mock('next/image', async () => (await import('@/__tests__/mocks/mock-components')).nextImageModule);
vi.mock('next/dynamic', async () => {
  const { lazy, Suspense } = await import('react');
  return {
    default: (loader: () => Promise<{ default: React.ComponentType }>) => {
      const Lazy = lazy(loader);
      return function Dynamic(props: object) {
        return (
          <Suspense fallback={null}>
            <Lazy {...props} />
          </Suspense>
        );
      };
    },
  };
});
vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('@/lib/server/requests', () => ({ GETRequest: vi.fn(), PATCHRequest: vi.fn() }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

let sessionUser: UserSession;
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session: { user: sessionUser } }) }));

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), useParams: () => ({ id: 'c1' }) }));

const sidebar = { isOpen: true, setIsOpen: vi.fn(), onMobile: false };
vi.mock('@/components/hooks/queries/useInfoSidebarOpen', () => ({ default: () => sidebar }));

let onMobile = false;
vi.mock('@/components/hooks/useUserAgent', () => ({ default: () => ({ onMobile }) }));

const OK = { status: 'OK', message: '', data: null };

let conversation: Conversation;
let bob: User;
let carol: User;

/**
 * Renders with `conversation` already cached as fresh, the way the page leaves it. Nothing is
 * garbage-collected, so cache entries no component observes (conversation lists) can be asserted on.
 */
function renderInfo(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, staleTime: Infinity, gcTime: Infinity },
  });
  queryClient.setQueryData(['conversation', 'c1'], conversation);
  return renderWithQuery(ui, queryClient);
}

function cached(queryClient: ReturnType<typeof makeQueryClient>) {
  return queryClient.getQueryData<Conversation>(['conversation', 'c1'])!;
}

function groupChat(overrides: Partial<Conversation> = {}) {
  return mockConversation({
    id: 'c1',
    name: 'Team',
    members: [bob, carol],
    admins: [sessionUser as unknown as User],
    nicknames: [
      { user: bob.id, value: '' },
      { user: carol.id, value: 'Caz' },
    ],
    ...overrides,
  } as Partial<Conversation>);
}

function oneToOne(overrides: Partial<Conversation> = {}) {
  return mockConversation({
    id: 'c1',
    members: [bob],
    nicknames: [{ user: bob.id, value: '' }],
    ...overrides,
  } as Partial<Conversation>);
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser = mockSession({ displayName: 'Me' });
  bob = mockUser({ displayName: 'Bob', userName: '@bob', email: 'bob@example.com' });
  carol = mockUser({ displayName: 'Carol', userName: '@carol' });
  conversation = groupChat();
  sidebar.isOpen = true;
  onMobile = false;
  vi.mocked(axiosInstance.get).mockImplementation(async () => ({ data: { data: conversation } }));
  vi.mocked(PATCHRequest).mockResolvedValue(OK as never);
});
afterEach(() => vi.unstubAllGlobals());

describe('InfoSidebar', () => {
  it("shows a one-to-one chat's person, their status and every section", async () => {
    bob = mockUser({ displayName: 'Bob', status: UserStatus.ONLINE });
    conversation = oneToOne();

    const { container } = renderInfo(<InfoSidebar />);

    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
    for (const section of ['Customization', 'Media', 'Privacy & Support'])
      expect(screen.getByRole('button', { name: section })).toBeInTheDocument();
  });

  it('says when an offline person was last online', async () => {
    bob = mockUser({ status: UserStatus.OFFLINE, lastOnline: new Date(Date.now() - 2 * 3600 * 1000) });
    conversation = oneToOne();

    renderInfo(<InfoSidebar />);

    expect(await screen.findByText('Online 2 hour(s) ago')).toBeInTheDocument();
  });

  it('shows admins and members only in a group chat', async () => {
    renderInfo(<InfoSidebar />);

    expect(await screen.findByRole('button', { name: 'Admins & Members' })).toBeInTheDocument();
  });

  it('hides the sections from someone who was blocked', async () => {
    conversation = oneToOne({ status: ConversationStatus.BLOCKED, blocker: bob.id });

    renderInfo(<InfoSidebar />);

    await screen.findByText('Bob');
    expect(screen.queryByRole('button', { name: 'Customization' })).not.toBeInTheDocument();
  });

  it('keeps the sections for whoever did the blocking', async () => {
    conversation = oneToOne({ status: ConversationStatus.BLOCKED, blocker: sessionUser.id });

    renderInfo(<InfoSidebar />);

    expect(await screen.findByRole('button', { name: 'Privacy & Support' })).toBeInTheDocument();
  });

  it('is hidden when closed and closes from its back button', async () => {
    sidebar.isOpen = false;
    const { container } = renderInfo(<InfoSidebar />);

    expect(container.querySelector('section')).toHaveClass('hidden');

    await userEvent.click(screen.getAllByRole('button')[0]);
    expect(sidebar.setIsOpen).toHaveBeenCalledWith(false);
  });
});

describe('InfoCustomization', () => {
  it('offers photo, name and nicknames for a group chat', async () => {
    renderInfo(<InfoCustomization />);

    await userEvent.click(screen.getByRole('button', { name: 'Customization' }));

    expect(screen.getByRole('button', { name: 'Change photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change chat name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add nicknames' })).toBeInTheDocument();
  });

  it('offers only nicknames for a one-to-one chat', async () => {
    conversation = oneToOne();
    renderInfo(<InfoCustomization />);

    await userEvent.click(screen.getByRole('button', { name: 'Customization' }));

    expect(screen.queryByRole('button', { name: 'Change photo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add nicknames' })).toBeInTheDocument();
  });
});

describe('InfoAdminsAndMembers', () => {
  it('renders nothing for a one-to-one chat', () => {
    conversation = oneToOne();

    const { container } = renderInfo(<InfoAdminsAndMembers />);

    expect(container).toBeEmptyDOMElement();
  });

  it('lists the admins and the members of a group', async () => {
    renderInfo(<InfoAdminsAndMembers />);

    await userEvent.click(screen.getByRole('button', { name: 'Admins & Members' }));
    await userEvent.click(screen.getByRole('button', { name: 'Admins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Members' }));

    expect(screen.getByRole('button', { name: 'Me' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bob' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carol' })).toBeInTheDocument();
  });
});

describe('Admins and Members lists', () => {
  it('opens a member’s profile', async () => {
    renderInfo(<Members />);

    await userEvent.click(screen.getByRole('button', { name: 'Members' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bob' }));

    expect(within(await screen.findByRole('dialog')).getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows admins', async () => {
    renderInfo(<Admins />);

    await userEvent.click(screen.getByRole('button', { name: 'Admins' }));

    expect(screen.getByRole('button', { name: 'Me' })).toBeInTheDocument();
  });
});

describe('ManageAdmin', () => {
  it('is hidden from someone who is not an admin', () => {
    conversation = groupChat({ admins: [bob] });

    renderInfo(<ManageAdmin />);

    expect(screen.getByRole('button', { name: 'Manage admin' })).toBeDisabled();
  });

  it('makes a member an admin', async () => {
    const { queryClient } = renderInfo(<ManageAdmin />);
    await userEvent.click(screen.getByRole('button', { name: 'Manage admin' }));
    const dialog = await screen.findByRole('dialog');

    const bobRow = within(dialog).getByText('Bob').closest('div.justify-between') as HTMLElement;
    await userEvent.click(within(bobRow).getByRole('button', { name: 'Add' }));

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/conversation/c1/admins', { adminAction: 'ADD', admin: bob.id });
    await waitFor(() => expect(cached(queryClient).admins.map((a) => a.id)).toContain(bob.id));
  });

  it('removes an admin', async () => {
    conversation = groupChat({ admins: [sessionUser as unknown as User, carol] });
    const { queryClient } = renderInfo(<ManageAdmin />);
    await userEvent.click(screen.getByRole('button', { name: 'Manage admin' }));
    const dialog = await screen.findByRole('dialog');

    const carolRow = within(dialog).getByText('Carol').closest('div.justify-between') as HTMLElement;
    await userEvent.click(within(carolRow).getByRole('button', { name: 'Remove' }));

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/conversation/c1/admins', { adminAction: 'REMOVE', admin: carol.id });
    await waitFor(() => expect(cached(queryClient).admins.map((a) => a.id)).not.toContain(carol.id));
  });

  it('leaves the admins unchanged when the server refuses', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue({ status: 'FORBIDDEN', message: 'not allowed', data: null } as never);
    const { queryClient } = renderInfo(<ManageAdmin />);
    await userEvent.click(screen.getByRole('button', { name: 'Manage admin' }));
    const dialog = await screen.findByRole('dialog');

    const bobRow = within(dialog).getByText('Bob').closest('div.justify-between') as HTMLElement;
    await userEvent.click(within(bobRow).getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('not allowed'));
    expect(cached(queryClient).admins.map((a) => a.id)).not.toContain(bob.id);
  });
});

describe('ManageMember', () => {
  async function openDialog() {
    await userEvent.click(screen.getByRole('button', { name: 'Manage Members' }));
    return screen.findByRole('dialog');
  }

  it('is disabled for someone who is not an admin', () => {
    conversation = groupChat({ admins: [bob] });

    renderInfo(<ManageMember />);

    expect(screen.getByRole('button', { name: 'Manage Members' })).toBeDisabled();
  });

  it('removes a member from the members list', async () => {
    const { queryClient } = renderInfo(<ManageMember />);
    const dialog = await openDialog();

    const bobRow = within(dialog).getByText('@bob').closest('div.justify-between') as HTMLElement;
    await userEvent.click(within(bobRow).getByRole('button', { name: 'Remove' }));

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/conversation/c1/members', { member: bob.id, action: 'REMOVE' });
    await waitFor(() => expect(cached(queryClient).members.map((m) => m.id)).toEqual([carol.id]));
  });

  it('searches for people and adds one', async () => {
    const dave = mockUser({ displayName: 'Dave', userName: '@dave' });
    vi.mocked(GETRequest).mockImplementation(async (path: string) =>
      ({ status: 'OK', message: '', data: path.includes('/search/') ? [dave] : dave }) as never,
    );
    const { queryClient } = renderInfo(<ManageMember />);
    const dialog = await openDialog();

    await userEvent.type(within(dialog).getByPlaceholderText('Username'), 'da ve');
    await waitFor(() => expect(GETRequest).toHaveBeenCalledWith('/v1/user/search/da%20ve'));
    const daveRow = (await within(dialog).findByText('@dave')).closest('div.justify-between') as HTMLElement;
    await userEvent.click(within(daveRow).getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(cached(queryClient).members.map((m) => m.id)).toContain(dave.id));
    expect(GETRequest).toHaveBeenCalledWith('/v1/user/@dave');
    expect(PATCHRequest).toHaveBeenCalledWith('/v1/conversation/c1/members', { member: dave.id, action: 'ADD' });
  });

  it('removes the right member when removing from the search results', async () => {
    // Carol is the first search result but the second member: removal must not go by result position.
    vi.mocked(GETRequest).mockResolvedValue({ status: 'OK', message: '', data: [carol] } as never);
    const { queryClient } = renderInfo(<ManageMember />);
    const dialog = await openDialog();

    await userEvent.type(within(dialog).getByPlaceholderText('Username'), 'car');
    const results = await waitFor(() => {
      const rows = within(dialog).getAllByText('@carol');
      expect(rows).toHaveLength(2);
      return rows;
    });
    await userEvent.click(within(results[0].closest('div.justify-between') as HTMLElement).getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(cached(queryClient).members.map((m) => m.id)).toEqual([bob.id]));
  });

  it('shows why a change failed', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue({ status: 'FORBIDDEN', message: 'admins only', data: null } as never);
    const { queryClient } = renderInfo(<ManageMember />);
    const dialog = await openDialog();

    const bobRow = within(dialog).getByText('@bob').closest('div.justify-between') as HTMLElement;
    await userEvent.click(within(bobRow).getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admins only'));
    expect(cached(queryClient).members).toHaveLength(2);
  });

  it('clears the search', async () => {
    renderInfo(<ManageMember />);
    const dialog = await openDialog();
    const input = within(dialog).getByPlaceholderText('Username');
    await userEvent.type(input, 'abc');

    await userEvent.click(input.parentElement!.querySelector('button')!);

    expect(input).toHaveValue('');
  });
});

describe('AddNickname', () => {
  it('lists each nickname, or a prompt to set one', async () => {
    renderInfo(<AddNickname />);

    await userEvent.click(screen.getByRole('button', { name: 'Add nicknames' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Set nickname')).toBeInTheDocument();
    expect(within(dialog).getByText('Caz')).toBeInTheDocument();
  });

  it('saves a new nickname everywhere it is cached', async () => {
    const { queryClient } = renderInfo(<AddNickname />);
    queryClient.setQueryData([sessionUser.id, 'conversations'], [conversation]);
    await userEvent.click(screen.getByRole('button', { name: 'Add nicknames' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByText('Set nickname'));
    await userEvent.type(within(dialog).getByPlaceholderText('Set nickname'), 'Bobby{Enter}');

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/conversation/c1/nicknames', { nickname: { user: bob.id, value: 'Bobby' } });
    await waitFor(() => expect(cached(queryClient).nicknames).toContainEqual({ user: bob.id, value: 'Bobby' }));
    const list = queryClient.getQueryData<Conversation[]>([sessionUser.id, 'conversations'])!;
    expect(list[0].nicknames).toContainEqual({ user: bob.id, value: 'Bobby' });
  });

  it('edits an existing nickname, starting from its value', async () => {
    renderInfo(<AddNickname />);
    await userEvent.click(screen.getByRole('button', { name: 'Add nicknames' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByText('Caz'));

    expect(within(dialog).getByPlaceholderText('Set nickname')).toHaveValue('Caz');
  });

  it('shows why a nickname could not be saved', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue({ status: 'BAD REQUEST', message: 'too long', data: null } as never);
    renderInfo(<AddNickname />);
    await userEvent.click(screen.getByRole('button', { name: 'Add nicknames' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByText('Set nickname'));
    await userEvent.type(within(dialog).getByPlaceholderText('Set nickname'), 'x{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('too long'));
  });
});

describe('ChangeName', () => {
  it('is disabled for someone who is not an admin', () => {
    conversation = groupChat({ admins: [bob] });

    renderInfo(<ChangeName />);

    expect(screen.getByRole('button', { name: 'Change chat name' })).toBeDisabled();
  });

  it('renames the group and updates every cached copy', async () => {
    const { queryClient } = renderInfo(<ChangeName />);
    queryClient.setQueryData([sessionUser.id, 'conversations'], [conversation]);
    queryClient.setQueryData(['active', 'conversations', sessionUser.id], [conversation]);
    await userEvent.click(screen.getByRole('button', { name: 'Change chat name' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Team' }));
    const input = within(dialog).getByPlaceholderText('Change name');
    await userEvent.clear(input);
    await userEvent.type(input, 'Squad{Enter}');

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/conversation/c1/name', { name: 'Squad' });
    await waitFor(() => expect(cached(queryClient).name).toBe('Squad'));
    expect(queryClient.getQueryData<Conversation[]>([sessionUser.id, 'conversations'])![0].name).toBe('Squad');
    expect(queryClient.getQueryData<Conversation[]>(['active', 'conversations', sessionUser.id])![0].name).toBe('Squad');
    expect(toast.success).toHaveBeenCalledWith('name changed');
  });

  it('keeps the name when the server refuses', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue({ status: 'FORBIDDEN', message: 'nope', data: null } as never);
    const { queryClient } = renderInfo(<ChangeName />);
    await userEvent.click(screen.getByRole('button', { name: 'Change chat name' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Team' }));
    await userEvent.type(within(dialog).getByPlaceholderText('Change name'), '!{Enter}');

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));
    expect(cached(queryClient).name).toBe('Team');
  });
});

describe('ChangePhoto', () => {
  async function uploadInDialog() {
    await userEvent.click(screen.getByRole('button', { name: 'Change photo' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'upload photo' }));
    return dialog;
  }

  it('can only be confirmed once a photo is uploaded', async () => {
    renderInfo(<ChangePhoto />);
    await userEvent.click(screen.getByRole('button', { name: 'Change photo' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('button', { name: 'upload photo' }));
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });

  it('swaps the photo in every cached copy', async () => {
    conversation = groupChat({ photo: mockPhoto({ url: 'https://utfs.io/old.png' }) });
    const { queryClient } = renderInfo(<ChangePhoto />);
    queryClient.setQueryData(['active', 'conversations', sessionUser.id], [conversation]);
    const dialog = await uploadInDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    expect(PATCHRequest).toHaveBeenCalledWith('/v1/conversation/c1/photo', { photo: { url: UPLOADED_FILE.url } });
    await waitFor(() => expect(cached(queryClient).photo?.url).toBe(UPLOADED_FILE.url));
    expect(queryClient.getQueryData<Conversation[]>(['active', 'conversations', sessionUser.id])![0].photo?.url).toBe(
      UPLOADED_FILE.url,
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('refetches a conversation that had no photo yet', async () => {
    const { queryClient } = renderInfo(<ChangePhoto />);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const dialog = await uploadInDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['conversation', 'c1'] }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['active', 'conversations', sessionUser.id] });
  });

  it('keeps the dialog open when the photo cannot be saved', async () => {
    vi.mocked(PATCHRequest).mockResolvedValue({ status: 'FORBIDDEN', message: 'admins only', data: null } as never);
    renderInfo(<ChangePhoto />);
    const dialog = await uploadInDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('admins only'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('deletes the uploaded photo on cancel', async () => {
    const fetchMock = stubPhotoDelete();
    renderInfo(<ChangePhoto />);
    const dialog = await uploadInDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/photo', expect.objectContaining({ body: JSON.stringify({ key: UPLOADED_FILE.key }) }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('replaces an earlier upload, deleting it', async () => {
    const fetchMock = stubPhotoDelete();
    renderInfo(<ChangePhoto />);
    const dialog = await uploadInDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'upload photo' }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('InfoMedia', () => {
  const photo = (url: string) => mockPhoto({ url, id: url.split('/').pop()! });
  let mediaMessages: ReturnType<typeof mockMessage>[];

  beforeEach(() => {
    mediaMessages = [
      mockMessage({ sender: bob, photos: [photo('https://utfs.io/a1'), photo('https://utfs.io/a2')] }),
      mockMessage({ sender: carol, photos: [photo('https://utfs.io/b1')] }),
    ];
    vi.mocked(GETRequest).mockImplementation(async () => ({ status: 'OK', message: '', data: mediaMessages }) as never);
  });

  async function openMedia() {
    await userEvent.click(screen.getByRole('button', { name: 'Media' }));
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(3));
  }

  it('loads the photos once opened', async () => {
    renderInfo(<InfoMedia />);
    expect(GETRequest).not.toHaveBeenCalled();

    await openMedia();

    expect(GETRequest).toHaveBeenCalledWith('/v1/conversation/c1/media');
  });

  it('opens a photo with its sender', async () => {
    renderInfo(<InfoMedia />);
    await openMedia();

    await userEvent.click(screen.getByRole('img', { name: 'b1' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Carol')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'b1' })).toBeInTheDocument();
  });

  it('steps through every photo, wrapping around', async () => {
    renderInfo(<InfoMedia />);
    await openMedia();
    await userEvent.click(screen.getByRole('img', { name: 'a2' }));
    const dialog = await screen.findByRole('dialog');
    const [previous, next] = within(dialog)
      .getAllByRole('button')
      .filter((b) => b.querySelector('.lucide-chevron-left, .lucide-chevron-right'));

    await userEvent.click(next);
    expect(within(dialog).getByRole('img', { name: 'b1' })).toBeInTheDocument();
    await userEvent.click(next);
    expect(within(dialog).getByRole('img', { name: 'a1' })).toBeInTheDocument();
    await userEvent.click(previous);
    expect(within(dialog).getByRole('img', { name: 'b1' })).toBeInTheDocument();
  });

  it('hides the arrows and the sender on mobile', async () => {
    onMobile = true;
    renderInfo(<InfoMedia />);
    await openMedia();

    await userEvent.click(screen.getByRole('img', { name: 'a1' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('.lucide-chevron-left')).not.toBeInTheDocument();
  });

  it('downloads the open photo', async () => {
    const blob = new Blob(['x']);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => blob }));
    URL.createObjectURL = vi.fn(() => 'blob:url');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderInfo(<InfoMedia />);
    await openMedia();
    await userEvent.click(screen.getByRole('img', { name: 'a1' }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getAllByRole('button').find((b) => b.querySelector('.lucide-download'))!);

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith('https://utfs.io/a1');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });

  it('shows why media could not be loaded', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ status: 'NOT FOUND', message: 'no media', data: null } as never);
    renderInfo(<InfoMedia />);

    await userEvent.click(screen.getByRole('button', { name: 'Media' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('no media'));
  });
});

describe('InfoPrivacyAndSupport', () => {
  async function open() {
    await userEvent.click(screen.getByRole('button', { name: 'Privacy & Support' }));
  }

  it('reports the other person in a one-to-one chat', async () => {
    conversation = oneToOne();
    vi.mocked(axiosInstance.post).mockResolvedValue({});
    renderInfo(<InfoPrivacyAndSupport />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Report User' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Bob')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByPlaceholderText('Reason'), 'spam');
    await userEvent.click(within(dialog).getByRole('button', { name: 'send' }));

    expect(axiosInstance.post).toHaveBeenCalledWith('/v1/user/report', { reportedUser: bob.id, reason: 'spam' });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('User reported'));
  });

  it('lets you pick who to report in a group chat', async () => {
    renderInfo(<InfoPrivacyAndSupport />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Report User' }));
    const dialog = await screen.findByRole('dialog');
    const carolRow = within(dialog).getByText('Carol').parentElement!;
    await userEvent.click(within(carolRow).getByRole('button', { name: 'report' }));

    expect(within(dialog).getByText('Carol')).toHaveClass('font-medium');
    await userEvent.click(within(dialog).getByRole('button', { name: 'cancel' }));
    expect(within(dialog).getByText('Report user')).toBeInTheDocument();
  });

  it('shows a generic error when reporting fails', async () => {
    conversation = oneToOne();
    vi.mocked(axiosInstance.post).mockRejectedValue(new Error('500'));
    renderInfo(<InfoPrivacyAndSupport />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Report User' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByPlaceholderText('Reason'), 'spam');
    await userEvent.click(within(dialog).getByRole('button', { name: 'send' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
  });

  it('leaves a group chat', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({});
    renderInfo(<InfoPrivacyAndSupport />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Leave group chat' }));

    expect(axiosInstance.post).toHaveBeenCalledWith('/conversation/c1/leave');
  });

  it('blocks the other person in a one-to-one chat and refreshes', async () => {
    conversation = oneToOne();
    vi.mocked(axiosInstance.post).mockResolvedValue({});
    renderInfo(<InfoPrivacyAndSupport />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Block User' }));

    expect(axiosInstance.post).toHaveBeenCalledWith('/v1/block', { user: bob.id });
    await waitFor(() => expect(toast).toHaveBeenCalledWith('user as been blocked'));
    expect(axiosInstance.get).toHaveBeenCalledWith('/conversation/c1');
  });

  it('unblocks someone you blocked', async () => {
    conversation = oneToOne({ status: ConversationStatus.BLOCKED, blocker: sessionUser.id });
    vi.mocked(axiosInstance.delete).mockResolvedValue({});
    renderInfo(<InfoPrivacyAndSupport />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Unblock User' }));

    expect(axiosInstance.delete).toHaveBeenCalledWith('/v1/block');
    await waitFor(() => expect(toast).toHaveBeenCalledWith('user unblocked'));
  });

  it('shows a generic error when blocking fails', async () => {
    conversation = oneToOne();
    vi.mocked(axiosInstance.post).mockRejectedValue(new Error('500'));
    renderInfo(<InfoPrivacyAndSupport />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Block User' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
  });
});

describe('UserInfoDialog', () => {
  function renderDialog(user: User) {
    return renderInfo(
      <UserInfoDialog user={user}>
        <button>open profile</button>
      </UserInfoDialog>,
    );
  }

  it('shows the profile of someone online', async () => {
    renderDialog(mockUser({ displayName: 'Bob', userName: '@bob', email: 'bob@example.com', status: UserStatus.ONLINE }));

    await userEvent.click(screen.getByRole('button', { name: 'open profile' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Bob')).toBeInTheDocument();
    expect(within(dialog).getByText('bob@example.com')).toBeInTheDocument();
    expect(within(dialog).getByText('bob')).toBeInTheDocument();
    expect(within(dialog).getByText('Online')).toBeInTheDocument();
  });

  it.each([
    [30, 'online 30 seconds(s) ago'],
    [5 * 60 + 5, 'online 5 minute(s) ago'],
    [3 * 3600 + 5, 'online 3 hour(s) ago'],
    [2 * 86400 + 5, 'online 2 day(s) ago'],
  ])('says when an offline person was last online (%i seconds)', async (seconds, text) => {
    renderDialog(mockUser({ status: UserStatus.OFFLINE, lastOnline: new Date(Date.now() - seconds * 1000) }));

    await userEvent.click(screen.getByRole('button', { name: 'open profile' }));

    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('opens your existing conversation with them', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ status: 'OK', message: '', data: [{ id: 'existing' }] } as never);
    renderDialog(bob);
    await userEvent.click(screen.getByRole('button', { name: 'open profile' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Message' }));

    expect(GETRequest).toHaveBeenCalledWith(`/v1/conversation?members=${sessionUser.id},${bob.id}`);
    expect(push).toHaveBeenCalledWith('/conversation/existing');
  });

  it('starts a new message to them when you have no conversation yet', async () => {
    vi.mocked(GETRequest).mockResolvedValue({ status: 'OK', message: '', data: [] } as never);
    const { queryClient } = renderDialog(bob);
    await userEvent.click(screen.getByRole('button', { name: 'open profile' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Message' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/compose'));
    expect(queryClient.getQueryData(COMPOSE_SELECTED_USERS_QUERY_KEY)).toEqual([[bob.id, 'Bob']]);
  });

  it('shows an error when the lookup fails', async () => {
    vi.mocked(GETRequest).mockRejectedValue(new Error('offline'));
    renderDialog(bob);
    await userEvent.click(screen.getByRole('button', { name: 'open profile' }));

    await act(() => userEvent.click(screen.getByRole('button', { name: 'Message' })));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Oops! something went wrong'));
  });
});
