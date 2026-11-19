import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage, withoutAtSign } from '@/lib/utils';
import { USER_NAME_CHANGED, USER_NAME_MAX_LENGTH } from '@repo/constants';
import type { ServerResponse, User } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import { AtSign } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsChangeUserName() {
  const [inputIsOpen, setInputIsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const {
    session: { user, update },
  } = useAuth();

  const currentUserName = withoutAtSign(user?.userName);

  const changeUserName = useMutation<Pick<User, 'userName'>, Error, string>({
    async mutationFn(newUserName) {
      const { data: response } = await axiosInstance.patch<ServerResponse<Pick<User, 'userName'>>>(
        '/user/user-name',
        { userName: newUserName },
      );
      return response.data;
    },
    async onSuccess(saved) {
      await update({ userName: saved.userName });
      toast.success(USER_NAME_CHANGED);
      setInputIsOpen(false);
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });

  const trimmedUserName = withoutAtSign(userName.trim());
  const cannotConfirm = !trimmedUserName || trimmedUserName === currentUserName || changeUserName.isPending;

  return (
    <div>
      <span className="font-semibold">Username</span>
      <div>
        {inputIsOpen ? (
          <form
            className="flex items-center gap-2 relative"
            onSubmit={(e) => {
              e.preventDefault();
              if (cannotConfirm) return;
              changeUserName.mutate(trimmedUserName);
            }}
          >
            <AtSign className="h-4 w-auto absolute top-1/2 left-4 -translate-y-1/2" />
            <Input
              autoFocus
              placeholder="Username"
              maxLength={USER_NAME_MAX_LENGTH}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="pl-8"
            />
            <Button
              type="button"
              variant="outline"
              disabled={changeUserName.isPending}
              onClick={() => {
                setUserName(currentUserName);
                setInputIsOpen(false);
              }}
            >
              cancel
            </Button>
            <Button disabled={cannotConfirm}>confirm</Button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <p className="border rounded-sm p-2 w-full bg-secondary text-sm flex items-center gap-1">
              <AtSign className="h-4 w-auto" />
              <span>{currentUserName}</span>
            </p>
            <Button
              type="button"
              disabled={!user}
              variant="outline"
              onClick={() => {
                setUserName(currentUserName);
                setInputIsOpen(true);
              }}
            >
              change
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
