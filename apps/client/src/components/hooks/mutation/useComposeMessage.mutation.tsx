import { axiosInstance } from '@/lib/axios-instance';
import { appendMessage, createPendingMessage, markMessageFailed, removeMessage, replaceMessage } from '@/lib/utils';
import type { CachedMessage, MessagePages, PhotoInput } from '@/types/message.types';
import { MessagePayload, ServerResponse, User } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

export default function useComposeMessage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const sendMessage = useMutation<
    MessagePayload,
    AxiosError,
    { conversationId?: string; text: string; members: string[]; photos: PhotoInput[]; retryId?: string },
    { pendingId?: string }
  >({
    mutationFn: async ({ conversationId, text, members, photos }) => {
      const { data: response } = await axiosInstance.post<ServerResponse<MessagePayload>>('/message', {
        conversationId,
        text,
        photos,
        members,
      });

      return response.data;
    },
    onMutate: async ({ conversationId, text, photos, retryId }) => {
      const sender = queryClient.getQueryData<User>(['user', 'session']);
      if (!sender) return {};

      const queryKey = ['conversation', 'messages', conversationId];
      await queryClient.cancelQueries({ queryKey });

      const pendingMessage = createPendingMessage({
        conversationId: conversationId ?? '',
        sender,
        text,
        photos,
        resending: Boolean(retryId),
      });
      queryClient.setQueryData<MessagePages>(queryKey, (prev) =>
        appendMessage(prev && retryId ? removeMessage(prev, retryId) : prev, pendingMessage),
      );

      return { pendingId: pendingMessage.id };
    },
    onSuccess: async (messagePayload, { conversationId }, context) => {
      if (conversationId) {
        const newMessage: CachedMessage = { ...messagePayload, conversation: messagePayload.conversation.id };
        if (context?.pendingId) newMessage.clientKey = context.pendingId;

        queryClient.setQueryData<MessagePages>(
          ['conversation', 'messages', conversationId],
          (prev) => prev && replaceMessage(prev, context?.pendingId, newMessage),
        );
      } else {
        queryClient.removeQueries({ queryKey: ['conversation', 'messages', conversationId], exact: true });
      }
      router.push(`/conversation/${conversationId ? conversationId : messagePayload.conversation.id}`);
    },
    onError: (_error, { conversationId }, context) => {
      if (!context?.pendingId) return;
      const { pendingId } = context;

      queryClient.setQueryData<MessagePages>(
        ['conversation', 'messages', conversationId],
        (prev) => prev && markMessageFailed(prev, pendingId),
      );
    },
  });
  return {
    sendMessage,
  };
}
