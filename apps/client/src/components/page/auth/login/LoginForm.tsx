'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import Loading from '@/components/svg/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthServiceOptions } from '@repo/enums';
import { LoginCredentials } from '@repo/types';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import LoginForgetPasswordButton from './LoginForgetPasswordButton';
export default function LoginForm() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [viewPassword, setViewPassword] = useState(false);

  const { loginMutation } = useAuth();

  return (
    <form
      data-testid="login-form"
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();

        await loginMutation.mutateAsync({
          authOption: AuthServiceOptions.WITH_EMAIL_AND_PASSWORD,
          email: credentials.email,
          password: credentials.password,
        });
      }}
    >
      <Input
        required
        className="pl-10"
        placeholder="Email"
        type="email"
        value={credentials.email}
        onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
      />
      <div className=" grid gap-2">
        <div className="relative">
          <Input
            placeholder="Password"
            type={viewPassword ? 'text' : 'password'}
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
          />
          <Button
            data-testid="view-password-button"
            className="p-2 absolute right-2 top-1/2 -translate-y-1/2"
            size="icon"
            variant="ghost"
            tabIndex={-1}
            onClick={() => setViewPassword((prev) => !prev)}
            type="button"
          >
            {viewPassword ? <Eye className="h-full w-full" /> : <EyeOff className="h-full w-full" />}
          </Button>
        </div>
        <LoginForgetPasswordButton />
      </div>
      <Button
        disabled={!credentials.email || !credentials.password || loginMutation.isPending}
        className="w-full text-base"
        type="submit"
      >
        {loginMutation.isPending ? <Loading /> : 'Login'}
      </Button>
    </form>
  );
}
