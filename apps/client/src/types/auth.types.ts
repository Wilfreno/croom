import { AuthServiceOptions, OTPType } from '@repo/enums';
import { AuthenticatedUser, ServerResponse, SignUpFormData } from '@repo/types';
import { UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Dispatch, SetStateAction } from 'react';


export type SignUpFieldProps = {
  formData: SignUpFormData;
  setFormData: Dispatch<SetStateAction<SignUpFormData>>;
};

export type LoginCredentials = {
  email: string;
  password: string;
};


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
