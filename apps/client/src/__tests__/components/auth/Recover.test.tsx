import MockAuthProvider from '@/__tests__/mocks/MockAuthProvider';
import { mockCreateOTPMutation, succeedingCreateOTPMutate } from '@/__tests__/mocks/mock-mutation';
import { makeQueryClient } from '@/__tests__/mocks/MockQueryClientProvider';
import Page from '@/app/(auth)/recover/page';
import LoginForgetPasswordButton from '@/components/page/auth/login/LoginForgetPasswordButton';
import ResetPasswordForm from '@/components/page/auth/recover/ResetPasswordForm';
import { axiosInstance } from '@/lib/axios-instance';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { OTPType } from '@repo/enums';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/lib/axios-instance', () => ({ axiosInstance: { patch: vi.fn() } }));

const EMAIL = 'ada@example.com';
const STRONG = 'Str0ng!Passw0rd';

function axiosError(status: number, message: string) {
  return new AxiosError(message, String(status), undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse);
}

beforeEach(() => vi.clearAllMocks());

describe('LoginForgetPasswordButton', () => {
  it('links to account recovery', () => {
    render(<LoginForgetPasswordButton />);

    expect(screen.getByRole('link', { name: 'forgot your password?' })).toBeInTheDocument();
  });
});

describe('Recover page', () => {
  function renderPage(mutate = vi.fn()) {
    render(
      <QueryClientProvider client={makeQueryClient()}>
        <MockAuthProvider mockData={{ signup: { createOTPMutation: mockCreateOTPMutation({ mutate }) } as never }}>
          <Page />
        </MockAuthProvider>
      </QueryClientProvider>,
    );
    return { mutate };
  }

  it('asks for the email, with search disabled until one is typed', async () => {
    renderPage();
    const search = screen.getByRole('button', { name: 'Search' });

    expect(screen.getByLabelText('Search your email')).toBeInTheDocument();
    expect(search).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Search your email'), EMAIL);

    expect(search).toBeEnabled();
  });

  it('requests a recovery code and moves on to the reset form once it is sent', async () => {
    const { mutate } = renderPage(succeedingCreateOTPMutate());

    await userEvent.type(screen.getByLabelText('Search your email'), EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(mutate).toHaveBeenCalledWith({ email: EMAIL, type: OTPType.RECOVER }, expect.anything());
    expect(await screen.findByLabelText('Recovery OTP')).toBeInTheDocument();
  });

  it('stays on the email step when the code could not be sent', async () => {
    renderPage(vi.fn());

    await userEvent.type(screen.getByLabelText('Search your email'), 'nobody@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByLabelText('Search your email')).toBeInTheDocument();
    expect(screen.queryByLabelText('Recovery OTP')).not.toBeInTheDocument();
  });

  it('goes home from the email step', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(push).toHaveBeenCalledWith('/');
  });

  it('goes back to the email step from the reset form, keeping the email', async () => {
    renderPage(succeedingCreateOTPMutate());
    await userEvent.type(screen.getByLabelText('Search your email'), EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByLabelText('Recovery OTP');

    await userEvent.click(screen.getByRole('button', { name: 'Go Back' }));

    expect(await screen.findByLabelText('Search your email')).toHaveValue(EMAIL);
    expect(push).not.toHaveBeenCalled();
  });
});

describe('ResetPasswordForm', () => {
  afterEach(() => vi.useRealTimers());

  function renderForm() {
    render(
      <QueryClientProvider client={makeQueryClient()}>
        <ResetPasswordForm email={EMAIL} />
      </QueryClientProvider>,
    );
  }

  async function fill({ pin = '123456', password = STRONG, confirmPassword = STRONG } = {}) {
    if (pin) await userEvent.type(screen.getByLabelText('Recovery OTP'), pin);
    if (password) await userEvent.type(screen.getByLabelText('New Password'), password);
    if (confirmPassword) await userEvent.type(screen.getByLabelText('Confirm password'), confirmPassword);
  }

  const submit = () => screen.getByRole('button', { name: 'Change password' });

  it('labels each field so it can be found by its label', () => {
    renderForm();

    expect(screen.getByLabelText('Recovery OTP')).toHaveAttribute('id', 'recover-otp');
    expect(screen.getByLabelText('New Password')).toHaveAttribute('id', 'recover-new-password');
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('id', 'recover-confirm-password');
  });

  it('keeps the confirmation disabled until a new password is typed', async () => {
    renderForm();

    expect(screen.getByLabelText('Confirm password')).toBeDisabled();

    await userEvent.type(screen.getByLabelText('New Password'), 'a');

    expect(screen.getByLabelText('Confirm password')).toBeEnabled();
  });

  it('flags a confirmation that does not match and will not submit', async () => {
    renderForm();

    await fill({ confirmPassword: `${STRONG}x` });

    expect(screen.getByTestId('password-not-same')).toHaveTextContent('Password is not the same');
    expect(submit()).toBeDisabled();
  });

  it('will not submit a weak password', async () => {
    renderForm();

    await fill({ password: 'aaaaaaaa', confirmPassword: 'aaaaaaaa' });

    expect(submit()).toBeDisabled();
  });

  it('shows and hides the new password', async () => {
    renderForm();
    const input = screen.getByLabelText('New Password');
    const [toggle] = screen.getAllByRole('button').filter((button) => button.getAttribute('tabindex') === '-1');

    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('sends the email, code and new password to the recover endpoint', async () => {
    vi.mocked(axiosInstance.patch).mockResolvedValue({});
    renderForm();

    await fill();
    await userEvent.click(submit());

    expect(axiosInstance.patch).toHaveBeenCalledWith('/user/recover', {
      email: EMAIL,
      pin: '123456',
      password: STRONG,
      confirmPassword: STRONG,
    });
  });

  it('confirms the change, then counts down to the login page', async () => {
    // Real time still passes for userEvent; the countdown is stepped by hand.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(axiosInstance.patch).mockResolvedValue({});
    renderForm();
    await fill();
    await userEvent.click(submit());
    expect(await screen.findByText('Password Changed')).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/Redirecting to login page \(4\)/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(4000));
    expect(push).toHaveBeenCalledWith('/login');
  });

  it("shows the server's reason for a rejected code", async () => {
    vi.mocked(axiosInstance.patch).mockRejectedValue(axiosError(400, 'Invalid OTP'));
    renderForm();

    await fill({ pin: '000000' });
    await userEvent.click(submit());

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid OTP'));
    expect(screen.queryByText('Password Changed')).not.toBeInTheDocument();
  });

  it('shows a generic message for a server failure', async () => {
    vi.mocked(axiosInstance.patch).mockRejectedValue(axiosError(500, 'stack trace'));
    renderForm();

    await fill();
    await userEvent.click(submit());

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(SOMETHING_WENT_WRONG));
  });
});
