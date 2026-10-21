import { AuthServiceOptions, OTPType } from '@repo/enums';
import { UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Dispatch, SetStateAction } from 'react';
import { AuthenticatedUser, ServerResponse } from '../back-end';
export type SignUpFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  pin: string;
};

export type SignUpFieldProps = {
  formData: SignUpFormData;
  setFormData: Dispatch<SetStateAction<SignUpFormData>>;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * What `loginMutation` is called with.
 *
 * Credentials belong to the local path alone: the google path hands the browser
 * to the provider and has nothing to carry. Splitting the two on `authOption`
 * rather than making email and password optional means neither call site can be
 * written wrong -- the local one cannot forget the credentials, and the google
 * one cannot invent empty ones to satisfy the type.
 */
export type LoginVariables =
  | ({ authOption: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD } & LoginCredentials)
  | { authOption: AuthServiceOptions.WITH_GOOGLE };

export type AuthContextType = {
  session: {
    user: AuthenticatedUser | null;
    update: (data: Partial<AuthenticatedUser>) => Promise<void>;
  };
  logout: () => Promise<void>;
  loginMutation: UseMutationResult<void, AxiosError<ServerResponse>, LoginVariables, unknown>;
  signup: {
    submitSignUpFormMutation: UseMutationResult<void, AxiosError<ServerResponse>, SignUpFormData, unknown>;
    createOTPMutation: UseMutationResult<
      void,
      Error,
      {
        email: string;
        type: OTPType;
      },
      unknown
    >;
  };
};
