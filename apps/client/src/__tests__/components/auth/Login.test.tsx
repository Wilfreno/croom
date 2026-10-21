import MockAuthProvider from '@/__tests__/mocks/MockAuthProvider';
import { mockLoginMutation } from '@/__tests__/mocks/mock-mutation';
import Page from '@/app/(auth)/(form)/login/page';
import LoginForm from '@/components/page/auth/login/LoginForm';
import LoginWGoogle from '@/components/page/auth/login/LoginWGoogle';
import NavigateToSignUpButton from '@/components/page/auth/login/NavigateToSignUpButton';
import { AuthServiceOptions } from '@repo/enums';
import { AuthContextType } from '@repo/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn((path) => path) }),
  useSearchParams: () => ({ get: vi.fn((params) => params) }),
}));

const EMAIL = 'someone@example.com';
const PASSWORD = 'sup3rsecret';

function renderWithAuth(ui: React.ReactNode, auth?: Partial<AuthContextType>) {
  render(<MockAuthProvider mockData={auth}>{ui}</MockAuthProvider>);
}

/** The three controls the login form is made of, by the labels a user sees. */
function loginControls() {
  return {
    email: screen.getByPlaceholderText('Email'),
    password: screen.getByPlaceholderText('Password'),
    submit: screen.getByRole('button', { name: /login/i }),
  };
}

describe('Logging in', () => {
  beforeEach(() => vi.clearAllMocks());

  it('displays the headers', () => {
    renderWithAuth(<Page />);

    expect(screen.getByTestId('login-page-h1')).toBeInTheDocument();
    expect(screen.getByTestId('login-page-h2')).toBeInTheDocument();
  });

  it('displays a link to the signup page', () => {
    render(<NavigateToSignUpButton />);

    expect(screen.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument();
  });

  describe('Login w/ credentials', () => {
    it('displays a form, an email input, a password input and a button', () => {
      renderWithAuth(<LoginForm />);

      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      const { email, password, submit } = loginControls();
      expect(email).toBeInTheDocument();
      expect(password).toBeInTheDocument();
      expect(submit).toBeInTheDocument();
    });

    // The account is identified by email now, not by the @username the earlier
    // form asked for.
    it('asks for an email rather than a username', () => {
      renderWithAuth(<LoginForm />);

      expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument();
      expect(loginControls().email).toHaveAttribute('type', 'email');
    });

    it('keeps the button disabled until both fields are filled', async () => {
      renderWithAuth(<LoginForm />);
      const { email, password, submit } = loginControls();

      expect(submit).toBeDisabled();

      await userEvent.type(email, EMAIL);
      expect(submit).toBeDisabled();

      await userEvent.type(password, PASSWORD);
      expect(submit).toBeEnabled();

      await userEvent.clear(email);
      expect(submit).toBeDisabled();
    });

    it('submits the credentials down the local path', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      renderWithAuth(<LoginForm />, { loginMutation: mockLoginMutation({ mutateAsync }) });

      const { email, password, submit } = loginControls();
      await userEvent.type(email, EMAIL);
      await userEvent.type(password, PASSWORD);
      await userEvent.click(submit);

      expect(mutateAsync).toHaveBeenCalledWith({
        authOption: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
        email: EMAIL,
        password: PASSWORD,
      });
    });

    it('does not submit the password as part of the url or leave it readable', async () => {
      renderWithAuth(<LoginForm />);
      const { password } = loginControls();

      await userEvent.type(password, PASSWORD);

      expect(password).toHaveAttribute('type', 'password');
    });

    it('reveals and re-hides the password on request', async () => {
      renderWithAuth(<LoginForm />);
      const { password } = loginControls();
      const reveal = screen.getByTestId('view-password-button');

      await userEvent.click(reveal);
      expect(password).toHaveAttribute('type', 'text');

      await userEvent.click(reveal);
      expect(password).toHaveAttribute('type', 'password');
    });

    it('shows a spinner and blocks a second submit while the request is in flight', async () => {
      renderWithAuth(<LoginForm />, { loginMutation: mockLoginMutation({ isPending: true }) });

      await userEvent.type(screen.getByPlaceholderText('Email'), EMAIL);
      await userEvent.type(screen.getByPlaceholderText('Password'), PASSWORD);

      // Queried by type rather than by name: the spinner has replaced the
      // label, which is the point -- there is nothing left to match on.
      const submit = screen.getByTestId('login-form').querySelector('button[type="submit"]');

      expect(submit).toBeDisabled();
      expect(submit).not.toHaveTextContent('Login');
      expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
    });
  });

  describe('Login w/ GOOGLE', () => {
    it('displays a button to log in with google', () => {
      renderWithAuth(<LoginWGoogle />);

      expect(screen.getByTestId('login-w-google')).toBeInTheDocument();
    });

    // The provider turns this into a whole-page navigation to the api, which is
    // why the button carries no credentials of its own.
    it('starts the google flow with no credentials attached', async () => {
      const mutateAsync = vi.fn().mockResolvedValue(undefined);
      renderWithAuth(<LoginWGoogle />, { loginMutation: mockLoginMutation({ mutateAsync }) });

      await userEvent.click(screen.getByTestId('login-w-google'));

      expect(mutateAsync).toHaveBeenCalledWith({ authOption: AuthServiceOptions.WITH_GOOGLE });
    });
  });
});
