import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import type { Conversation, User } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function useManageMember(conversationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['conversation', conversationId];

  function onError(error: Error) {
    toast.error(getServerErrorMessage(error));
    queryClient.invalidateQueries({ exact: true, queryKey });
  }

  const addMember = useMutation<void, Error, User>({
    async mutationFn(user) {
      await axiosInstance.post(`/conversation/${conversationId}/members`, { memberId: user.id });
    },
    onSuccess(_, user) {
      queryClient.setQueryData<Conversation>(queryKey, (prev) => {
        if (!prev || prev.members.some((member) => member.id === user.id)) return prev;

        return {
          ...prev,
          members: [...prev.members, user],
          nicknames: [...prev.nicknames, { user: user.id, value: '' }],
        };
      });
    },
    onError,
  });

  const removeMember = useMutation<void, Error, string>({
    async mutationFn(memberId) {
      await axiosInstance.delete(`/conversation/${conversationId}/members/${memberId}`);
    },
    onSuccess(_, memberId) {
      queryClient.setQueryData<Conversation>(
        queryKey,
        (prev) =>
          prev && {
            ...prev,
            members: prev.members.filter((member) => member.id !== memberId),
            admins: prev.admins.filter((admin) => admin.id !== memberId),
            nicknames: prev.nicknames.filter((nickname) => nickname.user !== memberId),
          },
      );
    },
    onError,
  });

  return { addMember, removeMember };
}
