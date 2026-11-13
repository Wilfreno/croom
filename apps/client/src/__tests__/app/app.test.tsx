import MockAuthProvider from '@/__tests__/mocks/MockAuthProvider';
import { mockCreateOTPMutation } from '@/__tests__/mocks/mock-mutation';
import { renderWithQuery } from '@/__tests__/mocks/render-with-query';
import FormLayout from '@/app/(auth)/(form)/layout';
import SignUpPage from '@/app/(auth)/(form)/sign-up/page';
import AuthLayout from '@/app/(auth)/layout';
import RecoverLayout from '@/app/(auth)/recover/layout';
import RecoverPage from '@/app/(auth)/recover/page';
import CallLayout from '@/app/(call)/layout';
import ConversationLayout from '@/app/(main)/(home)/conversation/[id]/layout';
import ConversationPage from '@/app/(main)/(home)/conversation/[id]/page';
import ConversationError from '@/app/(main)/(home)/conversation/error';
import HomeLayout from '@/app/(main)/(home)/layout';
import HomePage from '@/app/(main)/(home)/page';
import MainLayout from '@/app/(main)/layout';
import { DELETE } from '@/app/api/photo/route';
import { ourFileRouter } from '@/app/api/uploadthing/core';
import RootLayout, { metadata } from '@/app/layout';
import PasswordToolTip from '@/components/page/auth/PasswordToolTip';
import SignupNavigateToLoginPage from '@/components/page/auth/signup/SignupNavigateToLoginPage';
import { UploadThingButton, UploadThingDropzone } from '@/components/page/UploadthingButton';
import GoogleSvg from '@/components/svg/GoogleSvg';
import Loading from '@/components/svg/Loading';
import { uploadThingApi } from '@/lib/server/uploadthing';
import { OTPType } from '@repo/enums';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', async () => (await import('@/__tests__/mocks/mock-components')).nextImageModule);
vi.mock('next/font/google', () => ({ Work_Sans: () => ({ className: 'work-sans' }) }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('@/lib/server/uploadthing', () => ({ uploadThingApi: { deleteFiles: vi.fn() } }));

const push = vi.fn();
let searchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
  useParams: () => ({ id: 'c1' }),
  usePathname: () => '/',
}));

// Page-level composition is what's under test here; the pieces have their own tests.
vi.mock('@/components/page/main/SideBar/Aside', () => ({ default: () => <nav>aside</nav> }));
vi.mock('@/components/page/main/SideBar/ConversationSideBar', () => ({ default: () => <nav>conversation list</nav> }));
vi.mock('@/components/page/main/info/InfoSidebar', () => ({ default: () => <aside>info sidebar</aside> }));
vi.mock('@/components/page/main/conversation/ConversationHeader', () => ({
  default: ({ conversationInfo }: { conversationInfo: { conversationName: string } }) => (
    <header>header: {conversationInfo?.conversationName}</header>
  ),
}));
vi.mock('@/components/page/main/conversation/ConversationMessages', () => ({ default: () => <div>messages</div> }));
vi.mock('@/components/page/main/conversation/ConversationMessageInput', () => ({ default: () => <div>message input</div> }));
vi.mock('@/components/page/auth/recover/ResetPasswordForm', () => ({
  default: ({ email }: { email: string }) => <div>reset password for {email}</div>,
}));
vi.mock('@/components/page/auth/signup/SignupForm', () => ({ default: () => <form aria-label="sign up form" /> }));

const conversationQuery = { data: undefined as unknown, isError: false, error: null as Error | null };
vi.mock('@/components/hooks/queries/useConversation', () => ({ default: () => conversationQuery }));
vi.mock('@/components/hooks/queries/useConversationInfo', () => ({
  default: () => ({ data: { conversationName: 'Bob', photoUrl: '', status: null, lastOnline: '' } }),
}));
const sidebar = { isOpen: false, onMobile: false };
vi.mock('@/components/hooks/queries/useInfoSidebarOpen', () => ({ default: () => sidebar }));

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
  Object.assign(conversationQuery, { data: { id: 'c1' }, isError: false, error: null });
  Object.assign(sidebar, { isOpen: false, onMobile: false });
});

describe('api/photo DELETE', () => {
  function deleteRequest(body: unknown) {
    return new Request('http://localhost/api/photo', { method: 'DELETE', body: JSON.stringify(body) });
  }

  it('deletes the file from UploadThing', async () => {
    const response = await DELETE(deleteRequest({ key: 'abc' }));

    expect(uploadThingApi.deleteFiles).toHaveBeenCalledWith('abc');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'OK', message: 'photo deleted', data: null });
  });

  it('reports a failure as a 500 the client recognises', async () => {
    vi.mocked(uploadThingApi.deleteFiles).mockRejectedValue(new Error('UploadThing down'));

    const response = await DELETE(deleteRequest({ key: 'abc' }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      status: 'INTERNAL SERVER ERROR',
      message: 'Oops! something went wrong',
      data: null,
    });
  });

  it('rejects a body that is not JSON', async () => {
    const response = await DELETE(new Request('http://localhost/api/photo', { method: 'DELETE', body: 'nope' }));

    expect(response.status).toBe(500);
    expect(uploadThingApi.deleteFiles).not.toHaveBeenCalled();
  });
});

describe('api/uploadthing', () => {
  it('offers a multi-image and a single-image endpoint', () => {
    expect(Object.keys(ourFileRouter)).toEqual(['multipleImage', 'singleImage']);
  });

  it('builds typed upload components from the router', () => {
    expect(UploadThingButton).toBeTypeOf('function');
    expect(UploadThingDropzone).toBeTypeOf('function');
  });
});

describe('RootLayout', () => {
  it('names the app', () => {
    expect(metadata).toEqual({ title: 'Croom', description: 'Simple chat app where you and your friends can hangout' });
  });

  it('wraps the app in the query, auth and socket providers, in that order', () => {
    const tree = RootLayout({ children: <p>page</p> }) as React.ReactElement<{ lang: string; children: React.ReactElement }>;

    expect(tree.props.lang).toBe('en');
    const body = tree.props.children as React.ReactElement<{ className: string; children: React.ReactElement[] }>;
    expect(body.props.className).toContain('work-sans');
    const [queryProvider] = body.props.children;
    const [authProvider] = (queryProvider.props as { children: React.ReactElement[] }).children;
    const socketProvider = (authProvider.props as { children: React.ReactElement }).children;
    expect((authProvider.type as { name: string }).name).toBe('AuthProvider');
    expect((socketProvider.type as { name: string }).name).toBe('SocketIOProvider');
  });
});

describe('main layouts', () => {
  it('puts the aside and conversation list beside the page', () => {
    render(<MainLayout>page content</MainLayout>);

    expect(screen.getByText('aside')).toBeInTheDocument();
    expect(screen.getByText('conversation list')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('adds the info sidebar next to a conversation', () => {
    render(<ConversationLayout>conversation</ConversationLayout>);

    expect(screen.getByText('conversation')).toBeInTheDocument();
    expect(screen.getByText('info sidebar')).toBeInTheDocument();
  });

  it.each([
    ['home', HomeLayout],
    ['call', CallLayout],
  ])('the %s layout renders its page as is', (_, Layout) => {
    render(<Layout>just the page</Layout>);

    expect(screen.getByText('just the page')).toBeInTheDocument();
  });
});

describe('home page', () => {
  it('toggles the conversation list from "Select"', async () => {
    const { queryClient } = renderWithQuery(<HomePage />);
    await waitFor(() => expect(queryClient.getQueryData(['home', 'sidebar'])).toBe(true));

    await userEvent.click(screen.getByRole('button', { name: 'Select' }));

    expect(queryClient.getQueryData(['home', 'sidebar'])).toBe(false);
  });

  it('starts a new conversation from "Compose"', async () => {
    renderWithQuery(<HomePage />);

    await userEvent.click(screen.getByRole('button', { name: 'Compose' }));

    expect(push).toHaveBeenCalledWith('/compose');
  });
});

describe('conversation page', () => {
  it('shows the header, messages and input', () => {
    render(<ConversationPage />);

    expect(screen.getByText('header: Bob')).toBeInTheDocument();
    expect(screen.getByText('messages')).toBeInTheDocument();
    expect(screen.getByText('message input')).toBeInTheDocument();
  });

  it('gives the screen to the info sidebar when it is open on mobile', () => {
    Object.assign(sidebar, { isOpen: true, onMobile: true });

    const { container } = render(<ConversationPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it('throws a failed load to the error page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    Object.assign(conversationQuery, { isError: true, error: new Error('Conversation not found') });

    expect(() => render(<ConversationPage />)).toThrow('Conversation not found');
  });

  it('error page shows the reason', () => {
    render(<ConversationError error={new Error('Conversation not found')} reset={vi.fn()} />);

    expect(screen.getByText('Conversation not found')).toBeInTheDocument();
  });
});

describe('auth layouts and pages', () => {
  it('auth layout links the logo home', () => {
    render(<AuthLayout>form</AuthLayout>);

    expect(screen.getByRole('link', { name: 'Croom' })).toHaveAttribute('href', '/');
    expect(screen.getByText('form')).toBeInTheDocument();
  });

  it('form layout shows the landing image beside the form', () => {
    const { container } = render(<FormLayout>form</FormLayout>);

    expect(container.querySelector('img')).toBeInTheDocument();
    expect(screen.getByText('form')).toBeInTheDocument();
  });

  it('recover layout titles the page', () => {
    render(<RecoverLayout>steps</RecoverLayout>);

    expect(screen.getByText('Recover your account')).toBeInTheDocument();
  });

  it('sign-up page welcomes you above the form', async () => {
    render(await SignUpPage());

    expect(screen.getByRole('heading', { name: 'Welcome!' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'sign up form' })).toBeInTheDocument();
  });
});

describe('recover page', () => {
  it('sends a recovery code, then asks for the new password', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    render(
      <MockAuthProvider mockData={{ signup: { createOTPMutation: mockCreateOTPMutation({ mutateAsync }) } as never }}>
        <RecoverPage />
      </MockAuthProvider>,
    );

    await userEvent.type(screen.getByLabelText('Search your email'), 'me@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(mutateAsync).toHaveBeenCalledWith({ email: 'me@example.com', type: OTPType.RECOVER });
    expect(await screen.findByText('reset password for me@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));
    expect(await screen.findByLabelText('Search your email')).toHaveValue('me@example.com');
  });

  it('goes home from the first step', async () => {
    render(
      <MockAuthProvider>
        <RecoverPage />
      </MockAuthProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(push).toHaveBeenCalledWith('/');
  });

  it('cannot search without an email', () => {
    render(
      <MockAuthProvider>
        <RecoverPage />
      </MockAuthProvider>,
    );

    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });
});

describe('small auth pieces', () => {
  it('PasswordToolTip lists the password rules when open', async () => {
    render(<PasswordToolTip open />);

    expect((await screen.findAllByText('Must be at least 8 characters')).length).toBeGreaterThan(0);
  });

  it('PasswordToolTip stays closed otherwise', () => {
    render(<PasswordToolTip open={false} />);

    expect(screen.queryByText('Must be at least 8 characters')).not.toBeInTheDocument();
  });

  it('SignupNavigateToLoginPage links to login', () => {
    render(<SignupNavigateToLoginPage />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/login');
  });

  it('SignupNavigateToLoginPage keeps where you came from', () => {
    searchParams = new URLSearchParams('from=/conversation/c1');

    render(<SignupNavigateToLoginPage />);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/login?from=/conversation/c1');
  });
});

describe('svg icons', () => {
  it('render', () => {
    const { container } = render(
      <>
        <Loading />
        <GoogleSvg />
      </>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
});
