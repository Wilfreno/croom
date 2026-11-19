'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import { DELETED_USER_DISPLAY_NAME } from '@repo/constants';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsDeleteAccount() {
  const [value, setValue] = useState('');

  const { logout } = useAuth();

  const deleteAccount = useMutation({
    async mutationFn() {
      await axiosInstance.delete('/user');
    },
    async onSuccess() {
      await logout();
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });

  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">Delete account</span>
      <Dialog onOpenChange={(open) => !open && setValue('')}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete</Button>
        </DialogTrigger>
        <DialogContent className="w-96 grid gap-4">
          <DialogHeader>
            <DialogTitle>Delete your account</DialogTitle>
            <DialogDescription className="text-xs">
              This signs you out everywhere and removes your profile. Your messages stay in their conversations under
              &quot;{DELETED_USER_DISPLAY_NAME}&quot;. Type <strong>&quot;DELETE&quot;</strong> and press confirm to continue.
            </DialogDescription>
            <div className="grid gap-2">
              <Input
                autoFocus
                autoComplete="off"
                placeholder='Type "DELETE" to confirm'
                value={value}
                onChange={(e) => setValue(e.currentTarget.value)}
              />
              <Button
                disabled={value.toUpperCase() !== 'DELETE' || deleteAccount.isPending}
                variant="destructive"
                className="justify-self-end"
                onClick={() => deleteAccount.mutate()}
              >
                Confirm
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
