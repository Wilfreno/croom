'use client';
import usePasswordStrengthChecker from '@/components/hooks/usePasswordStrengthChecker';
import Loading from '@/components/svg/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '@/lib/axios-instance';
import { SOMETHING_WENT_WRONG } from '@repo/constants';
import { ServerResponse } from '@repo/types';
import { passwordStrengthScorePerCriteriaSatisfied } from '@repo/utils';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CSSProperties, useEffect, useState } from 'react';
import { toast } from 'sonner';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';
import PasswordToolTip from '../PasswordToolTip';

export default function ResetPasswordForm({ email }: { email: string }) {
  const [formData, setFormData] = useState({
    pin: '',
    password: '',
    confirmPassword: '',
  });
  const [seePassword, setSeePassword] = useState([false, false]);
  const [reRoute, setReRoute] = useState<{
    time: number;
    go: boolean;
    intervalId?: NodeJS.Timeout;
  }>({ time: 5, go: false });

  const { getStrengthColor, score } = usePasswordStrengthChecker(formData.password);

  const router = useRouter();
  const changePassword = useMutation<void, AxiosError<ServerResponse>>({
    mutationFn: async () => {
      await axiosInstance.patch('/user/recover', {
        email,
        ...formData,
      });
    },
    onError(error) {
      if (error.response?.status! < 500) toast.error(error.response?.data.message);
      else toast.error(SOMETHING_WENT_WRONG);
    },
    onSuccess() {
      setReRoute((prev) => ({ ...prev, go: true }));
    },
  });

  useEffect(() => {
    if (!reRoute.go) return;

    const id = setInterval(() => {
      setReRoute((prev) => {
        if (prev.time <= 1) {
          router.push('/login');
          return { time: 5, go: false };
        }
        return { ...prev, time: prev.time - 1 };
      });
    }, 1000);

    return () => clearInterval(id);
  }, [reRoute.go]);

  if (changePassword.isSuccess)
    return (
      <section className="flex flex-col gap-20">
        <div className="grid place-items-center gap-8">
          <h1 className="text-2xl font-medium">Password Changed</h1>
          <Check className="h-20 w-auto text-green-500 stroke-2 bg-secondary rounded-full" />
        </div>
        Redirecting to login page {reRoute.go ? `(${reRoute.time})` : ''}
      </section>
    );

  return (
    <form
      className="grid gap-8 w-96"
      onSubmit={(e) => {
        e.preventDefault();
        changePassword.mutate();
      }}
    >
      <div className="grid gap-4 relative">
        <div>
          <Label htmlFor="recover-new-password">Recovery OTP</Label>
          <Input
            type="tel"
            id="recover-otp"
            placeholder="Enter OTP"
            value={formData.pin}
            onChange={(e) => setFormData((prev) => ({ ...prev, pin: e.target.value }))}
            className="pr-12"
          />
        </div>
        <div className="grid gap-2">
          <div>
            <Label htmlFor="recover-new-password">New Password</Label>
            <PasswordToolTip
              open={Boolean(formData.password) && score < passwordStrengthScorePerCriteriaSatisfied(5)}
            />
            <div className="relative">
              <Input
                type={seePassword[0] ? 'text' : 'password'}
                id="recover-new-password"
                placeholder="New password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                style={
                  {
                    '--strength-ring': formData.password ? getStrengthColor() : undefined,
                  } as CSSProperties
                }
                className="focus-visible:ring-[color:var(--strength-ring,hsl(var(--ring)))]"
              />
              <Button
                type="button"
                variant="ghost"
                tabIndex={-1}
                className="aspect-square h-fit w-auto p-1 absolute top-1/2 right-2 -translate-y-1/2"
                onClick={() => setSeePassword((prev) => [!prev[0], prev[1]])}
              >
                {seePassword[0] ? <Eye className="h-full w-full" /> : <EyeOff className="h-full w-full" />}
              </Button>
            </div>
          </div>

          <PasswordStrengthIndicator password={formData.password} />
        </div>
        <div>
          <Label htmlFor="recover-confirm-password">Confirm password</Label>

          <div className="relative">
            <Input
              disabled={!formData.password.length && !formData.confirmPassword}
              type={seePassword[1] ? 'text' : 'password'}
              id="recover-confirm-password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
            <Button
              type="button"
              variant="ghost"
              tabIndex={-1}
              className="aspect-square h-fit w-auto p-2 absolute top-1/2 right-2 -translate-y-1/2"
              onClick={() => setSeePassword((prev) => [prev[0], !prev[1]])}
            >
              {seePassword[1] ? <Eye className="h-full w-full" /> : <EyeOff className="h-full w-full" />}
            </Button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <span data-testid="password-not-same" className="text-xs text-muted-foreground text-red-500">
              Password is not the same
            </span>
          )}
        </div>
      </div>

      <Button
        disabled={
          !formData.password ||
          formData.password !== formData.confirmPassword ||
          score < passwordStrengthScorePerCriteriaSatisfied(5) ||
          changePassword.isPending
        }
      >
        {changePassword.isPending ? <Loading /> : 'Change password'}
      </Button>
    </form>
  );
}
