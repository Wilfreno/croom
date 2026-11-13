import { mockSession } from '@/__tests__/mocks/mock-entities';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import AuthProvider, { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { AuthContextType } from '@/types/auth.types';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { AuthServiceOptions, OTPType } from '@repo/enums';
import type { UserSession } from '@repo/types';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { get: vi.fn(), post: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('next/image', () => ({ default: (props: { alt: string }) => <img alt={props.alt} /> }));

const push = vi.fn();
let pathname = '/';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => pathname }));

const get = vi.mocked(axiosInstance.get);
const post = vi.mocked(axiosInstance.post);

const SERVER_V1 = 'http://localhost:8000/v1';

function signedInAs(user: UserSession | null) {
  if (user) get.mockResolvedValue({ data: { status: 'OK', message: '', data: user } });
  else get.mockRejectedValue(new Error('401'));
}

function axiosError(status: number, data: Record<string, unknown>) {
  return new AxiosError('failed', String(status), undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

/** Renders the provider and hands back the context its children see. */
async function renderAuth() {
  let context!: AuthContextType;
  function Probe() {
    context = useAuth();
    return <p>app content</p>;
  }
  const rendered = renderWithQuery(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await waitFor(() => expect(get).toHaveBeenCalledWith('/auth/session'));
  return { ...rendered, auth: () => context };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SERVER_V1', SERVER_V1);
  pathname = '/';
});
afterEach(() => vi.unstubAllEnvs());

describe('useAuth', () => {
  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useAuth())).toThrow(/only available on components under/);
  });
});

describe('AuthProvider routing', () => {
  it('shows the splash screen while the session loads', () => {
    get.mockReturnValue(new Promise(() => undefined));

    renderWithQuery(
      <AuthProvider>
        <p>app content</p>
      </AuthProvider>,
    );

    expect(screen.getByText('Croom')).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('shows the app to a signed-in user', async () => {
    signedInAs(mockSession());

    await renderAuth();

    expect(await screen.findByText('app content')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('sends a signed-out user to the login page', async () => {
    signedInAs(null);
    pathname = '/conversation/1';

    await renderAuth();

    await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it.each(['/login', '/sign-up', '/recover'])('lets a signed-out user use %s', async (path) => {
    signedInAs(null);
    pathname = path;

    await renderAuth();

    expect(await screen.findByText('app content')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it.each(['/login', '/sign-up'])('sends a signed-in user away from %s', async (path) => {
    signedInAs(mockSession());
    pathname = path;

    await renderAuth();

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });
});

describe('AuthProvider session', () => {
  it('exposes the session user and merges updates into it', async () => {
    const user = mockSession({ displayName: 'Before' });
    signedInAs(user);
    const { auth } = await renderAuth();
    await waitFor(() => expect(auth().session.user?.id).toBe(user.id));

    await act(() => auth().session.update({ displayName: 'After' }));

    await waitFor(() => expect(auth().session.user?.displayName).toBe('After'));
    expect(auth().session.user?.email).toBe(user.email);
  });

  it('logs out through the server', async () => {
    signedInAs(mockSession());
    const { auth } = await renderAuth();
    await screen.findByText('app content');

    await act(() => auth().logout());

    expect(push).toHaveBeenCalledWith(SERVER_V1 + '/auth/logout');
  });
});

describe('AuthProvider login', () => {
  beforeEach(() => {
    signedInAs(null);
    pathname = '/login';
  });

  it('logs in with email and password, stores the session and goes home', async () => {
    const user = mockSession();
    post.mockResolvedValue({ data: { status: 'OK', message: '', data: user } });
    const { auth, queryClient } = await renderAuth();

    await act(() =>
      auth().loginMutation.mutateAsync({
        authOption: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
        email: 'a@b.co',
        password: 'secret',
      }),
    );

    expect(post).toHaveBeenCalledWith('/auth/local/login', { email: 'a@b.co', password: 'secret' });
    expect(queryClient.getQueryData(['user', 'session'])).toEqual(user);
    expect(push).toHaveBeenCalledWith('/');
  });

  it('hands Google login to the server with a full page navigation', async () => {
    const assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign });
    const { auth } = await renderAuth();

    await act(() => auth().loginMutation.mutateAsync({ authOption: AuthServiceOptions.WITH_GOOGLE }));

    expect(assign).toHaveBeenCalledWith(SERVER_V1 + '/auth/google/login');
    expect(push).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("shows the server's reason when login fails", async () => {
    post.mockRejectedValue(axiosError(401, { message: 'wrong email or password' }));
    const { auth } = await renderAuth();

    act(() =>
      auth().loginMutation.mutate({ authOption: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD, email: 'a', password: 'b' }),
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('wrong email or password'));
  });

  it('falls back to a generic message when the server gives none', async () => {
    post.mockRejectedValue(new AxiosError('Network Error'));
    const { auth } = await renderAuth();

    act(() =>
      auth().loginMutation.mutate({ authOption: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD, email: 'a', password: 'b' }),
    );

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
  });
});

describe('AuthProvider sign-up', () => {
  beforeEach(() => {
    signedInAs(null);
    pathname = '/sign-up';
  });

  it('sends an OTP and confirms where it went', async () => {
    post.mockResolvedValue({ data: {} });
    const { auth } = await renderAuth();

    await act(() => auth().signup.createOTPMutation.mutateAsync({ email: 'a@b.co', type: OTPType.SIGNUP }));

    expect(post).toHaveBeenCalledWith('/otp', { email: 'a@b.co', type: OTPType.SIGNUP });
    expect(toast.success).toHaveBeenCalledWith('An OTP has been sent to a@b.co');
  });

  it("shows the server's reason for a rejected OTP request", async () => {
    post.mockRejectedValue(axiosError(429, { message: 'too many requests' }));
    const { auth } = await renderAuth();

    act(() => auth().signup.createOTPMutation.mutate({ email: 'a@b.co', type: OTPType.SIGNUP }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('too many requests'));
  });

  it('hides server errors behind a generic message', async () => {
    post.mockRejectedValue(axiosError(500, { message: 'stack trace' }));
    const { auth } = await renderAuth();

    act(() => auth().signup.createOTPMutation.mutate({ email: 'a@b.co', type: OTPType.SIGNUP }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
  });

  it('creates an email-and-password account and goes to the login page', async () => {
    post.mockResolvedValue({ data: {} });
    const { auth } = await renderAuth();
    const formData = { email: 'a@b.co', password: 'secret', confirmPassword: 'secret', pin: '123456' };

    await act(() => auth().signup.submitSignUpFormMutation.mutateAsync(formData as never));

    expect(post).toHaveBeenCalledWith('/user', {
      ...formData,
      authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
    });
    expect(toast.success).toHaveBeenCalledWith('User successfully created');
    expect(push).toHaveBeenCalledWith('/login');
  });

  it('shows a validation message from the server', async () => {
    post.mockRejectedValue(axiosError(400, { status: 'BAD REQUEST', message: 'invalid pin' }));
    const { auth } = await renderAuth();

    act(() => auth().signup.submitSignUpFormMutation.mutate({} as never));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('invalid pin'));
  });

  it('shows a generic message for any other sign-up failure', async () => {
    post.mockRejectedValue(axiosError(500, { status: 'INTERNAL SERVER ERROR', message: 'oops' }));
    const { auth } = await renderAuth();

    act(() => auth().signup.submitSignUpFormMutation.mutate({} as never));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
  });
});
