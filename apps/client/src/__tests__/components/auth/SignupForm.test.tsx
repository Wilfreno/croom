import MockAuthProvider from '@/__tests__/mocks/MockAuthProvider';
import { mockCreateOTPMutation } from '@/__tests__/mocks/mock-mutation';
import { makeQueryClient } from '@/__tests__/mocks/MockQueryClientProvider';
import { GET, POST } from '@/app/api/uploadthing/route';
import SignUpForm from '@/components/page/auth/signup/SignupForm';
import { EmailStatus } from '@repo/enums';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/components/hooks/queries/useEmailCheck', () => ({
  default: () => ({ data: EmailStatus.AVAILABLE, isLoading: false }),
}));

function renderForm(mutateAsync = vi.fn().mockResolvedValue(undefined)) {
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <MockAuthProvider mockData={{ signup: { createOTPMutation: mockCreateOTPMutation({ mutateAsync }) } as never }}>
        <SignUpForm />
      </MockAuthProvider>
    </QueryClientProvider>,
  );
  return { mutateAsync };
}

describe('SignUpForm', () => {
  it('starts on the email and password step, with Google sign-up and a login link', () => {
    renderForm();

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('moves on to the code step once the details are filled in', async () => {
    const { mutateAsync } = renderForm();

    await userEvent.type(screen.getByPlaceholderText('Email'), 'new@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'Str0ng!Passw0rd');
    await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'Str0ng!Passw0rd');
    await userEvent.click(screen.getByRole('button', { name: /next|sign up|continue/i }));

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@example.com' }));
    expect(await screen.findByRole('button', { name: /resend/i })).toBeInTheDocument();
  });
});

describe('api/uploadthing route', () => {
  it('serves the UploadThing handlers', () => {
    expect(GET).toBeTypeOf('function');
    expect(POST).toBeTypeOf('function');
  });
});
