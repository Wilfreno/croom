import { mockConversation, mockMessage, mockSession, mockUser } from '@/__tests__/mocks/mock-entities';
import { makeQueryClient } from '@/__tests__/mocks/MockQueryClientProvider';
import { renderHookWithQuery } from '@/__tests__/mocks/render-with-query';
import useActiveConversation from '@/components/hooks/queries/useActiveConversation';
import useConversation from '@/components/hooks/queries/useConversation';
import useConversationInfo from '@/components/hooks/queries/useConversationInfo';
import useConversations from '@/components/hooks/queries/useConversations';
import useEmailCheck from '@/components/hooks/queries/useEmailCheck';
import useInfoSidebarOpen from '@/components/hooks/queries/useInfoSidebarOpen';
import useMessages from '@/components/hooks/queries/useMessages';
import useSearchConversations from '@/components/hooks/queries/useSearchConversations';
import useSearchConversationsByMembers from '@/components/hooks/queries/useSearchConversationsByMember';
import useSearchUsers from '@/components/hooks/queries/useSearchUsers';
import useSessionQuery from '@/components/hooks/queries/useSessionQuery';
import { axiosInstance } from '@/lib/axios-instance';
import { SECONDS_IN_DAY, SECONDS_IN_HOUR, SECONDS_IN_MINUTE, SOMETHING_WENT_WRONG } from '@repo/constants';
import { CheckUserDataType, EmailStatus, UserStatus } from '@repo/enums';
import type { UserSession } from '@repo/types';
import { act, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { get: vi.fn(), post: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

let sessionUser: UserSession | null;
vi.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ session: { user: sessionUser } }) }));

let onMobile = false;
vi.mock('@/components/hooks/useUserAgent', () => ({ default: () => ({ onMobile }) }));

const get = vi.mocked(axiosInstance.get);

/** Resolves `axiosInstance.get` the way the server wraps a payload. */
function serverReturns(data: unknown) {
  get.mockResolvedValue({ data: { status: 'OK', message: '', data } });
}

function axiosError(status: number) {
  return new AxiosError('failed', String(status), undefined, undefined, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionUser = mockSession();
  onMobile = false;
});

describe('useConversation', () => {
  it('fetches the conversation by id', async () => {
    const conversation = mockConversation();
    serverReturns(conversation);

    const { result } = renderHookWithQuery(() => useConversation(conversation.id));

    await waitFor(() => expect(result.current.data).toEqual(conversation));
    expect(get).toHaveBeenCalledWith(`/conversation/${conversation.id}`);
  });

  it('does nothing without an id', () => {
    renderHookWithQuery(() => useConversation(undefined));

    expect(get).not.toHaveBeenCalled();
  });

  it('exposes the error when the request fails', async () => {
    get.mockRejectedValue(axiosError(404));

    const { result } = renderHookWithQuery(() => useConversation('abc'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(AxiosError);
  });
});

describe('useConversations', () => {
  it("lists the session user's conversations", async () => {
    const conversations = [mockConversation(), mockConversation()];
    serverReturns(conversations);

    const { result } = renderHookWithQuery(() => useConversations());

    expect(result.current.conversations).toEqual([]);
    await waitFor(() => expect(result.current.conversations).toEqual(conversations));
    expect(get).toHaveBeenCalledWith('/user/conversations');
  });

  it('waits for a session', () => {
    sessionUser = null;

    renderHookWithQuery(() => useConversations());

    expect(get).not.toHaveBeenCalled();
  });

  it('shows a toast when the list cannot be loaded', async () => {
    get.mockRejectedValue(axiosError(500));

    renderHookWithQuery(() => useConversations());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
  });
});

describe('useActiveConversation', () => {
  it('lists conversations with someone online', async () => {
    const active = [mockConversation()];
    serverReturns(active);

    const { result } = renderHookWithQuery(() => useActiveConversation());

    await waitFor(() => expect(result.current.activeConversations).toEqual(active));
    expect(get).toHaveBeenCalledWith('/user/active-conversation');
  });

  /** The hook sets its own `retry`, which overrides the test client's; only skip the backoff wait. */
  function clientWithoutRetryDelay() {
    const queryClient = makeQueryClient();
    queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retryDelay: 0 } });
    return queryClient;
  }

  it('does not retry a client error', async () => {
    get.mockRejectedValue(axiosError(401));

    const { result } = renderHookWithQuery(() => useActiveConversation(), { queryClient: clientWithoutRetryDelay() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('retries a server error up to three times', async () => {
    get.mockRejectedValue(axiosError(503));

    const { result } = renderHookWithQuery(() => useActiveConversation(), { queryClient: clientWithoutRetryDelay() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(get).toHaveBeenCalledTimes(4);
  });
});

describe('useConversationInfo', () => {
  it('uses the group name and photo for a group chat', async () => {
    const conversation = mockConversation({
      name: 'Team',
      members: [mockUser(), mockUser()],
      photo: { id: 'p', url: 'https://utfs.io/team' } as never,
    });

    const { result } = renderHookWithQuery(() => useConversationInfo(conversation));

    await waitFor(() =>
      expect(result.current.data).toEqual({
        photoUrl: 'https://utfs.io/team',
        conversationName: 'Team',
        status: null,
        lastOnline: '',
      }),
    );
  });

  it("uses the other person's nickname in a one-to-one chat", async () => {
    const other = mockUser({ displayName: 'Bob' });
    const conversation = mockConversation({ members: [other], nicknames: [{ user: other.id, value: 'Bobby' }] });

    const { result } = renderHookWithQuery(() => useConversationInfo(conversation));

    await waitFor(() => expect(result.current.data?.conversationName).toBe('Bobby'));
    expect(result.current.data?.status).toBe(UserStatus.ONLINE);
  });

  it('falls back to their display name when they have no nickname', async () => {
    const conversation = mockConversation({ members: [mockUser({ displayName: 'Bob' })] });

    const { result } = renderHookWithQuery(() => useConversationInfo(conversation));

    await waitFor(() => expect(result.current.data?.conversationName).toBe('Bob'));
  });

  it.each([
    [30, '30 second(s) ago'],
    [SECONDS_IN_MINUTE * 5 + 10, '5 minute(s) ago'],
    [SECONDS_IN_HOUR * 3 + 10, '3 hour(s) ago'],
    [SECONDS_IN_DAY * 2 + 10, '2 day(s) ago'],
  ])('says when an offline person was last online (%i seconds)', async (seconds, text) => {
    const other = mockUser({ status: UserStatus.OFFLINE, lastOnline: new Date(Date.now() - seconds * 1000) });
    const conversation = mockConversation({ members: [other] });

    const { result } = renderHookWithQuery(() => useConversationInfo(conversation));

    await waitFor(() => expect(result.current.data?.lastOnline).toBe(text));
  });

  it('leaves last-online empty for someone online', async () => {
    const conversation = mockConversation();

    const { result } = renderHookWithQuery(() => useConversationInfo(conversation));

    await waitFor(() => expect(result.current.data?.status).toBe(UserStatus.ONLINE));
    expect(result.current.data?.lastOnline).toBe('');
  });

  it('waits for both a conversation and a session', () => {
    sessionUser = null;
    const conversation = mockConversation();

    const { result } = renderHookWithQuery(() => useConversationInfo(conversation));

    expect(result.current.data?.conversationName).toBe('');
  });
});

describe('useEmailCheck', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  it('checks the email once typing has paused for a second', async () => {
    get.mockResolvedValue({ data: { data: EmailStatus.AVAILABLE } });

    const { result } = renderHookWithQuery(() => useEmailCheck('a@b.co'));
    expect(get).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(1000));

    await waitFor(() => expect(result.current.data).toBe(EmailStatus.AVAILABLE));
    expect(get).toHaveBeenCalledWith(`/user/check/${CheckUserDataType.EMAIL}/a@b.co`);
    vi.useRealTimers();
  });

  it('does not check an empty email', async () => {
    renderHookWithQuery(() => useEmailCheck(''));

    await act(async () => vi.advanceTimersByTime(1000));

    expect(get).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('useInfoSidebarOpen', () => {
  it('starts open on desktop and closed on mobile', async () => {
    const desktop = renderHookWithQuery(() => useInfoSidebarOpen());
    await waitFor(() => expect(desktop.result.current.isOpen).toBe(true));

    onMobile = true;
    const mobile = renderHookWithQuery(() => useInfoSidebarOpen());
    await waitFor(() => expect(mobile.result.current.onMobile).toBe(true));
    expect(mobile.result.current.isOpen).toBe(false);
  });

  it('can be toggled, and shares its state across components', async () => {
    const { result, queryClient } = renderHookWithQuery(() => useInfoSidebarOpen());
    const other = renderHookWithQuery(() => useInfoSidebarOpen(), { queryClient });
    await waitFor(() => expect(result.current.isOpen).toBe(true));

    act(() => result.current.setIsOpen((prev) => !prev));

    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(other.result.current.isOpen).toBe(false);
  });
});

describe('useMessages', () => {
  it('loads the first page of messages for a single found conversation', async () => {
    const conversation = mockConversation();
    const messages = [mockMessage()];
    serverReturns(messages);

    const { result } = renderHookWithQuery(() => useMessages([conversation]));

    await waitFor(() => expect(result.current.foundMessages?.pages).toEqual([{ pageParam: 1, result: messages }]));
    expect(get).toHaveBeenCalledWith(`/conversation/${conversation.id}/messages?page=1`);
  });

  it.each([
    ['no conversation', []],
    ['more than one conversation', [mockConversation(), mockConversation()]],
  ])('does not load messages for %s', (_, conversations) => {
    renderHookWithQuery(() => useMessages(conversations));

    expect(get).not.toHaveBeenCalled();
  });
});

describe('useSearchConversations', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  it('searches once typing pauses', async () => {
    const found = [mockConversation()];
    serverReturns(found);

    const { result } = renderHookWithQuery(() => useSearchConversations('team'));
    expect(get).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(300));

    await waitFor(() => expect(result.current.data).toEqual(found));
    expect(get).toHaveBeenCalledWith('/conversation/search/team');
    vi.useRealTimers();
  });
});

describe('useSearchUsers', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  it('searches the debounced text, never "undefined"', async () => {
    const found = [mockUser()];
    serverReturns(found);

    const { result } = renderHookWithQuery(() => useSearchUsers('bo'));
    expect(get).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(300));

    await waitFor(() => expect(result.current.data).toEqual(found));
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/user/search/bo');
    vi.useRealTimers();
  });

  it('starts with an empty list', () => {
    const { result } = renderHookWithQuery(() => useSearchUsers(''));

    expect(result.current.data).toEqual([]);
    vi.useRealTimers();
  });
});

describe('useSearchConversationsByMembers', () => {
  it('looks up conversations with exactly the selected users', async () => {
    const found = [mockConversation()];
    serverReturns(found);

    const { result } = renderHookWithQuery(() =>
      useSearchConversationsByMembers([
        ['u1', 'Alice'],
        ['u2', 'Bob'],
      ]),
    );

    await waitFor(() => expect(result.current.foundConversations).toEqual(found));
    expect(get).toHaveBeenCalledWith('/conversation?members=u1,u2');
  });

  it('does nothing until someone is selected', () => {
    renderHookWithQuery(() => useSearchConversationsByMembers([]));

    expect(get).not.toHaveBeenCalled();
  });

  it('reports a failed lookup', async () => {
    get.mockRejectedValue(axiosError(500));

    const { result } = renderHookWithQuery(() => useSearchConversationsByMembers([['u1', 'Alice']]));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useSessionQuery', () => {
  it('returns the signed-in user', async () => {
    const user = mockSession();
    serverReturns(user);

    const { result } = renderHookWithQuery(() => useSessionQuery());

    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(get).toHaveBeenCalledWith('/auth/session');
  });

  it('returns null instead of failing when there is no session', async () => {
    get.mockRejectedValue(axiosError(401));

    const { result } = renderHookWithQuery(() => useSessionQuery());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});
