'use client';
import { axiosInstance } from '@/lib/axios-instance';
import { AuthContextType, LoginVariables } from '@/types/auth.types';
import { User } from '@/types/model.types';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { AuthServiceOptions, OTPType } from '@repo/enums';
import { ServerResponse, SignUpFormData } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect } from 'react';
import { toast } from 'sonner';
import croomLogo from '../../../public/croom-logo.svg';
import useSessionQuery from '../hooks/queries/useSessionQuery';

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 *  A custom hook for the applications authentication system
 *
 * @returns  {AuthContext}
 *
 *  @see {@link AuthContext}
 */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useSession hook is only available on components under SessionProvider');
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const serverUrlv1 = process.env.NEXT_PUBLIC_SERVER_V1;

  const { user } = useSessionQuery();

  const loginMutation = useMutation<void, AxiosError<ServerResponse>, LoginVariables>({
    async mutationFn(variables) {
      switch (variables.authOption) {
        case AuthServiceOptions.WITH_GOOGLE: {
          // A whole-page navigation, not `router.push`: the api answers with a
          // redirect to google, and `onSuccess` must not race it back to '/'.
          window.location.assign(serverUrlv1 + '/auth/google/login');
          break;
        }
        case AuthServiceOptions.WITH_EMAIL_AND_PASSWORD: {
          const { email, password } = variables;

          const { data: response } = await axiosInstance.post<ServerResponse<User>>('/auth/local/login', {
            email,
            password,
          });

          queryClient.setQueryData(['user', 'session'], response.data);

          break;
        }
      }
    },
    onError(error) {
      toast.error(error.response?.data.message ?? SOMETHING_WENT_WRONG);
    },
    onSuccess(_, variables) {
      if (variables.authOption === AuthServiceOptions.WITH_GOOGLE) return;

      router.push('/');
    },
  });

  async function logout() {
    router.push(serverUrlv1 + '/auth/logout');
  }

  const createOTPMutation = useMutation<void, AxiosError<ServerResponse>, { email: string; type: OTPType }>({
    async mutationFn({ email, type }) {
      await axiosInstance.post('/otp', {
        email,
        type,
      });
    },

    onError(error) {
      if (error.response?.status! < 500) toast.error(error.response?.data.message);
      else toast.error(SOMETHING_WENT_WRONG);
    },
    onSuccess(_, { email }) {
      toast.success(`An OTP has been sent to ${email}`);
    },
  });

  const submitSignUpFormMutation = useMutation<void, AxiosError<ServerResponse>, SignUpFormData>({
    async mutationFn(formData) {
      await axiosInstance.post('/user', { ...formData, authService: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD });
    },
    onError(error) {
      if (error.response?.data.status === 'BAD REQUEST') toast.error(error.response?.data.message);
      else toast.error(SOMETHING_WENT_WRONG);
    },
    onSuccess() {
      toast.success('User successfully created');
      router.push('/login');
    },
  });

  async function update(updatedData: Partial<User>) {
    queryClient.setQueryData<User>(['user', 'session'], (previous) =>
      previous ? { ...previous, ...updatedData } : previous,
    );
  }

  useEffect(() => {
    if (!user) {
      if (!pathname.startsWith('/login') && !pathname.startsWith('/sign-up') && !pathname.startsWith('/recover'))
        router.push('/login');
    } else {
      if (pathname.startsWith('/login') || pathname.startsWith('/sign-up')) router.push('/');
    }
  }, [user, pathname]);

  return (
    <AuthContext.Provider
      value={{
        session: { user: user!, update },
        logout,
        loginMutation,
        signup: { createOTPMutation, submitSignUpFormMutation },
      }}
    >
      {user ? (
        children
      ) : pathname.startsWith('/login') || pathname.startsWith('/sign-up') || pathname.startsWith('/recover') ? (
        children
      ) : (
        <section className="fixed z-50 w-full h-full bg-background grid place-items-center ">
          <div className="relative flex flex-col items-center justify-center gap-2">
            <Image src={croomLogo} alt="logo" className="aspect-square h-40 w-auto" />
            <span className="text-5xl font-semibold bg-gradient-to-r from-[#7f00ff] to-[#e100ff] bg-clip-text text-transparent animate-pulse">
              Croom
            </span>
          </div>
        </section>
      )}
    </AuthContext.Provider>
  );
}
