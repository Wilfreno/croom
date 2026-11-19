import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import { DISPLAY_NAME_CHANGED, DISPLAY_NAME_MAX_LENGTH } from '@repo/constants';
import type { ServerResponse, User } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsChangeDisplayname() {
  const [inputIsOpen, setInputIsOpen] = useState(false);
  const [displayName, setDisplayname] = useState('');
  const {
    session: { user, update },
  } = useAuth();

  const changeDisplayName = useMutation<Pick<User, 'displayName'>, Error, string>({
    async mutationFn(newDisplayName) {
      const { data: response } = await axiosInstance.patch<ServerResponse<Pick<User, 'displayName'>>>(
        '/user/display-name',
        { displayName: newDisplayName },
      );
      return response.data;
    },
    async onSuccess(saved) {
      await update({ displayName: saved.displayName });
      toast.success(DISPLAY_NAME_CHANGED);
      setInputIsOpen(false);
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });

  const trimmedDisplayName = displayName.trim();
  const cannotConfirm =
    !trimmedDisplayName || trimmedDisplayName === user?.displayName || changeDisplayName.isPending;

  return (
    <div>
      <span className="font-semibold">Display name</span>
      {inputIsOpen ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (cannotConfirm) return;
            changeDisplayName.mutate(trimmedDisplayName);
          }}
        >
          <Input
            autoFocus
            placeholder="Display name"
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            value={displayName}
            onChange={(e) => setDisplayname(e.target.value)}
          />
          <Button
            variant="outline"
            type="button"
            disabled={changeDisplayName.isPending}
            onClick={() => {
              setDisplayname(user?.displayName ?? '');
              setInputIsOpen(false);
            }}
          >
            cancel
          </Button>
          <Button disabled={cannotConfirm}>confirm</Button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <span className="border rounded-sm p-2 w-full bg-secondary text-sm">{user?.displayName}</span>
          <Button
            type="button"
            disabled={!user}
            variant="outline"
            onClick={() => {
              setDisplayname(user?.displayName ?? '');
              setInputIsOpen(true);
            }}
          >
            change
          </Button>
        </div>
      )}
    </div>
  );
}
