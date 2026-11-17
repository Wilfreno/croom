import { useAuth } from '@/components/providers/AuthProvider';
import { axiosInstance } from '@/lib/axios-instance';
import { appendMessage, getServerErrorMessage, setCachedNicknames } from '@/lib/utils';
import type { MessagePages } from '@/types/message.types';
import type { Nickname, SetNicknameResult } from '@/types/nickname.types';
import type { ServerResponse } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function useSetNickname(conversationId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session.user?.id;

  return useMutation<SetNicknameResult | null | undefined, Error, Nickname>({
    async mutationFn(nickname) {
      const { data: response } = await axiosInstance.patch<ServerResponse<SetNicknameResult | null>>(
        `/conversation/${conversationId}/nicknames`,
        nickname,
      );
      return response?.data;
    },
    onSuccess(result, variables) {
      const nickname = { user: variables.user, value: variables.value.trim() };

      setCachedNicknames(queryClient, { conversationId, userId }, (nicknames) =>
        nicknames.map((entry) => (entry.user === nickname.user ? nickname : entry)),
      );

      if (result?.message) {
        const notice = { ...result.message, conversation: conversationId };
        queryClient.setQueryData<MessagePages>(
          ['conversation', 'messages', conversationId],
          (prev) => prev && appendMessage(prev, notice),
        );
        queryClient.invalidateQueries({ exact: true, queryKey: [userId, 'conversations'] });
      }
    },
    onError(error) {
      toast.error(getServerErrorMessage(error));
    },
  });
}
