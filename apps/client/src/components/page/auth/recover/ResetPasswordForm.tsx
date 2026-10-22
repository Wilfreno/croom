'use client';
import usePasswordStrengthChecker from '@/components/hooks/usePasswordStrengthChecker';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '@/lib/axios-instance';
import { PATCHRequest } from '@/lib/server/requests';
import { useMutation } from '@tanstack/react-query';
import { Check, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CSSProperties, useEffect, useState } from 'react';
import { toast } from 'sonner';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';
import PasswordToolTip from '../PasswordToolTip';

export default function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    pin: '',
    password: '',
    confirmPassword: '',
  });
  const [seePassword, setSeePassword] = useState([false, false]);
  const [resend, setResend] = useState<{
    time: number;
    open: boolean;
    intervalId?: NodeJS.Timeout;
  }>({ time: 30, open: true });

  const params = useParams<{ email: string }>();
  const { getStrengthColor, score } = usePasswordStrengthChecker(formData.password);

  const changePassword = useMutation({
    mutationFn: async () => {
      try {
        const {} = axiosInstance.patch('/v1/user');
        const { status, message } = await PATCHRequest('/v1/user/recover', {
          email: decodeURIComponent(params.email),
          pin,
          password,
        });

        if (status !== 'OK') throw new Error(message);
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
  });

  const {
    signup: { createOTPMutation },
  } = useAuth();

  async function handleResend() {
    const id = setInterval(() => {
      setResend((prev) => ({ ...prev, time: prev.time - 1 }));
    }, 1000);
    setResend((prev) => ({ ...prev, open: false, intervalId: id }));
    // await createOTP(decodeURIComponent(params.email), "RECOVER");
    setResend((prev) => ({ ...prev, intervalId: id }));
  }

  useEffect(() => {
    if (resend.time < 1) {
      clearInterval(resend.intervalId);
      setResend({ time: 30, open: true });
    }
  }, [resend.time]);

  if (changePassword.isSuccess)
    return (
      <section className="flex flex-col gap-20">
        <div className="grid place-items-center gap-8">
          <h1 className="text-2xl font-medium">Password Changed</h1>
          <Check className="h-20 w-auto text-green-500 stroke-2 bg-secondary rounded-full" />
        </div>
        <Button size="lg" variant="link" className="text-xl">
          <Link href="/login">Login</Link>
        </Button>
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
            <PasswordToolTip open={Boolean(formData.password) && score < scorePerCriteriaSatisfied(5)} />
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
          !formData.password || formData.password !== formData.confirmPassword || score < scorePerCriteriaSatisfied(5)
        }
      >
        Change password
      </Button>
    </form>
  );
}
