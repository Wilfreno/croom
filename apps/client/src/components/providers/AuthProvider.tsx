'use client';
import { axiosInstance } from '@/lib/axios-instance';
import { GETRequest, PATCHRequest } from '@/lib/server/requests';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { AuthServiceOptions, OTPType } from '@repo/enums';
import { AuthContextType, ServerResponse, SignUpFormData } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import croomLogo from '../../../public/croom-logo.svg';
import type { User } from '@repo/schemas';

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
  const [session, setSession] = useState<User | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const serverUrl = process.env.NEXT_PUBLIC_SERVER;

  async function getSession() {
    try {
      const { data, status } = await GETRequest<User>('/v1/auth/session');

      if (status !== 'OK') {
        if (!pathname.startsWith('/login') && !pathname.startsWith('/sign-up') && !pathname.startsWith('/recover'))
          router.replace('/login');
        return;
      }

      setSession(data);
    } catch (error) {
      throw error;
    }
  }

  async function login(strategy: 'GOOGLE' | 'LOCAL', credentials: { username: string; password: string } | undefined) {
    switch (strategy) {
      case 'GOOGLE': {
        try {
          router.push(serverUrl + '/v1/auth/google/login');
        } catch (error) {
          throw error;
        }
      }
      case 'LOCAL': {
        try {
          if (!credentials) throw new Error('LOCAL strategy requires username and password credentials');

          const { username, password } = credentials;
          if (!username) throw new Error('username is required on the credentials and cannot be empty');

          if (!password) throw new Error('password is required on the credentials and cannot be empty');

          const response = await fetch(serverUrl + '/v1/auth/local/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: '@' + username, password }),
          });

          if (!response.ok) {
            const responseJson = await response.json();
            toast.error(responseJson.message);
            return;
          }
          await getSession();
        } catch (error) {
          throw error;
        }
      }
    }
  }

  async function logout() {
    try {
      router.push(serverUrl + '/v1/auth/logout');
    } catch (error) {
    }
  }

  const createOTPMutation = useMutation<void, AxiosError<ServerResponse>, { email: string; type: OTPType }>({
    async mutationFn({ email, type }) {
      await axiosInstance.post('/otp', {
        email,
        type,
      });
    },

    onError(error) {
      if (error.response?.data.status === 'TOO MANY REQUESTS') toast.error(error.response?.data.message);
      else toast.error(SOMETHING_WENT_WRONG);
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
      toast.success('User successfuly created');
      router.push('/login');
    },
  });

  async function update(updatedData: Partial<User>) {
    try {
      const { data, message, status } = await PATCHRequest<User>('/v1/auth/update', updatedData);

      if (status !== 'OK') {
        toast.error(message);
        return;
      }
      setSession(data);
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    getSession();
  }, []);

  useEffect(() => {
    if (!session) {
      if (!pathname.startsWith('/login') && !pathname.startsWith('/sign-up') && !pathname.startsWith('/recover'))
        router.push('/login');
    } else {
      if (pathname.startsWith('/login') || pathname.startsWith('/sign-up')) router.push('/');
    }
  }, [session, pathname]);

  return (
    <AuthContext.Provider
      value={{
        session: { user: session, update },
        logout,
        login,
        signup: { createOTPMutation, submitSignUpFormMutation },
      }}
    >
      {session ? (
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
