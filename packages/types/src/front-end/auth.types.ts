import { OTPType } from '@repo/enums';
import { User } from '@repo/schemas';
import { UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Dispatch, SetStateAction } from 'react';
import { ServerResponse } from '../back-end';
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

export type AuthContextType = {
  session: { user: User | null; update: (data: Partial<User>) => Promise<void> };
  logout: () => Promise<void>;
  login: (
    strategy: 'GOOGLE' | 'LOCAL',
    credentials?: {
      username: string;
      password: string;
    },
  ) => Promise<void>;
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
