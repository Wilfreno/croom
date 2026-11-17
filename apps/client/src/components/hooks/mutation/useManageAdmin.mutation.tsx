import { axiosInstance } from '@/lib/axios-instance';
import { getServerErrorMessage } from '@/lib/utils';
import type { Conversation } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function useManageAdmin(conversationId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['conversation', conversationId];

  function onError(error: Error) {
    toast.error(getServerErrorMessage(error));
    queryClient.invalidateQueries({ exact: true, queryKey });
  }

  const addAdmin = useMutation<void, Error, string>({
    async mutationFn(memberId) {
      await axiosInstance.post(`/conversation/${conversationId}/admins`, { memberId });
    },
    onSuccess(_, memberId) {
      queryClient.setQueryData<Conversation>(queryKey, (prev) => {
        const member = prev?.members.find((entry) => entry.id === memberId);
        if (!prev || !member || prev.admins.some((admin) => admin.id === memberId)) return prev;

        return { ...prev, admins: [...prev.admins, member] };
      });
    },
    onError,
  });

  const removeAdmin = useMutation<void, Error, string>({
    async mutationFn(memberId) {
      await axiosInstance.delete(`/conversation/${conversationId}/admins/${memberId}`);
    },
    onSuccess(_, memberId) {
      queryClient.setQueryData<Conversation>(
        queryKey,
        (prev) => prev && { ...prev, admins: prev.admins.filter((admin) => admin.id !== memberId) },
      );
    },
    onError,
  });

  return { addAdmin, removeAdmin };
}
