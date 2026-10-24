'use client';
import { axiosInstance } from '@/lib/axios-instance';
import { AuthContextType, LoginVariables } from '@/types/auth.types';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { AuthServiceOptions, OTPType } from '@repo/enums';
import { AuthenticatedUser, ServerResponse, SignUpFormData } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import croomLogo from '../../../public/croom-logo.svg';

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
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const serverUrl = process.env.NEXT_PUBLIC_SERVER;

  async function getSession() {
    try {
      const { data } = await axiosInstance.get<ServerResponse<AuthenticatedUser>>('/auth/session');

      setUser(data.data);
    } catch {
      setUser(null);
    }
  }

  const loginMutation = useMutation<void, AxiosError<ServerResponse>, LoginVariables>({
    async mutationFn(variables) {
      switch (variables.authOption) {
        case AuthServiceOptions.WITH_GOOGLE: {
          router.push(serverUrl + '/v1/auth/google/login');
          break;
        }
        case AuthServiceOptions.WITH_EMAIL_AND_PASSWORD: {
          const { email, password } = variables;

          const { data: response } = await axiosInstance.post<ServerResponse<AuthenticatedUser>>('/auth/local/login', {
            email,
            password,
          });

          setUser(response.data);

          break;
        }
      }
    },
    onError(error) {
      toast.error(error.response?.data.message ?? SOMETHING_WENT_WRONG);
    },
    onSuccess() {
      router.push('/');
    },
  });

  async function logout() {
    router.push(serverUrl + '/v1/auth/logout');
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

  /**
   * Brings the local copy of the user in step with a change already saved
   * elsewhere. There is no request to make: a session record holds only an id
   * now, and the user document behind it is read fresh on every request, so
   * there is nothing on the server that could be out of date.
   */
  async function update(updatedData: Partial<AuthenticatedUser>) {
    setUser((previous) => (previous ? { ...previous, ...updatedData } : previous));
  }

  useEffect(() => {
    getSession();
  }, []);

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
        session: { user, update },
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
