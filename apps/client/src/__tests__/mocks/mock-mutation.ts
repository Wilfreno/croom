import { OTPType } from '@repo/enums';
import { AuthContextType, ServerResponse, SignUpFormData } from '@repo/types';
import { UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { vi } from 'vitest';

type Signup = AuthContextType['signup'];

/** The two mutation shapes the auth context exposes, named for readability. */
export type CreateOTPMutation = Signup['createOTPMutation'];
export type SubmitSignUpMutation = Signup['submitSignUpFormMutation'];

/**
 * A stand-in for the object `useMutation()` hands back. Only the fields the
 * signup components actually read are meaningful; the rest are filled in so the
 * shape still satisfies `UseMutationResult`.
 */
export default function mockMutation<TData, TError, TVariables>(
  overrides: Partial<UseMutationResult<TData, TError, TVariables>> = {},
): UseMutationResult<TData, TError, TVariables> {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined as TData),
    reset: vi.fn(),
    data: undefined,
    error: null,
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: true,
    isPaused: false,
    isPending: false,
    isSuccess: false,
    status: 'idle',
    submittedAt: 0,
    ...overrides,
  } as UseMutationResult<TData, TError, TVariables>;
}

export const mockCreateOTPMutation = (
  overrides: Partial<CreateOTPMutation> = {},
): CreateOTPMutation =>
  mockMutation<void, Error, { email: string; type: OTPType }>(overrides);

export const mockSubmitSignUpMutation = (
  overrides: Partial<SubmitSignUpMutation> = {},
): SubmitSignUpMutation =>
  mockMutation<void, AxiosError<ServerResponse>, SignUpFormData>(overrides);
