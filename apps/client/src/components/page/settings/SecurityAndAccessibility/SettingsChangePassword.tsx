'use client';
import PasswordStrengthIndicator from '@/components/page/auth/PasswordStrengthIndicator';
import usePasswordStrengthChecker from '@/components/hooks/usePasswordStrengthChecker';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { axiosInstance } from '@/lib/axios-instance';
import { cn, emptyChangePasswordForm, getServerErrorMessage } from '@/lib/utils';
import type { ChangePasswordForm } from '@/types/user-settings.types';
import { PASSWORD_CHANGED } from '@repo/constants';
import { AuthServiceOptions } from '@repo/enums';
import { passwordStrengthScorePerCriteriaSatisfied } from '@repo/utils';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          aria-label={visible ? `hide ${label}` : `show ${label}`}
          className="aspect-square h-8 p-2 w-auto absolute right-2 top-1/2 -translate-y-1/2"
          onClick={() => setVisible((previous) => !previous)}
        >
          {visible ? <Eye className="h-full w-auto" /> : <EyeOff className="h-full w-auto" />}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsChangePassword() {
  const [form, setForm] = useState<ChangePasswordForm>(emptyChangePasswordForm());
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const { session } = useAuth();
  const hasPassword = Boolean(session.user?.authService?.includes(AuthServiceOptions.WITH_EMAIL_AND_PASSWORD));
  const { score } = usePasswordStrengthChecker(form.password);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) formRef.current?.scrollIntoView();
  }, [open]);

  function close() {
    setForm(emptyChangePasswordForm());
    setFormKey((previous) => previous + 1);
    setOpen(false);
  }

  const changePassword = useMutation<void, Error, ChangePasswordForm>({
    async mutationFn({ currentPassword, password, confirmPassword }) {
      await axiosInstance.patch('/user/password', {
        currentPassword: hasPassword ? currentPassword : undefined,
        password,
        confirmPassword,
      });
    },
    onSuccess() {
      toast.success(PASSWORD_CHANGED);
      close();
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });

  const passwordsDiffer = form.password !== form.confirmPassword;
  const isWeak = score < passwordStrengthScorePerCriteriaSatisfied(5);
  const cannotConfirm =
    (hasPassword && !form.currentPassword) ||
    !form.password ||
    !form.confirmPassword ||
    passwordsDiffer ||
    isWeak ||
    changePassword.isPending;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-medium">Password</span>
        <Button
          variant="outline"
          onClick={() => {
            if (open) close();
            else setOpen(true);
          }}
        >
          {open ? 'Cancel' : hasPassword ? 'Change' : 'Set password'}
        </Button>
      </div>
      <form
        key={formKey}
        ref={formRef}
        className={cn(open ? 'grid gap-2 relative' : 'hidden')}
        onSubmit={(e) => {
          e.preventDefault();
          if (cannotConfirm) return;
          changePassword.mutate(form);
        }}
      >
        {hasPassword && (
          <PasswordField
            id="current-password"
            label="Current Password"
            value={form.currentPassword}
            onChange={(currentPassword) => setForm((previous) => ({ ...previous, currentPassword }))}
          />
        )}
        <PasswordField
          id="new-password"
          label="New Password"
          value={form.password}
          onChange={(password) => setForm((previous) => ({ ...previous, password }))}
        />
        <PasswordStrengthIndicator password={form.password} />
        <PasswordField
          id="confirm-password"
          label="Confirm Password"
          value={form.confirmPassword}
          onChange={(confirmPassword) => setForm((previous) => ({ ...previous, confirmPassword }))}
        />
        {passwordsDiffer && (
          <span className="text-xs font-medium text-destructive">Password is not the same</span>
        )}
        <Button type="submit" disabled={cannotConfirm} className="justify-self-end">
          Confirm
        </Button>
      </form>
    </div>
  );
}
