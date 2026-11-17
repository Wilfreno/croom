import { axiosInstance } from '@/lib/axios-instance';
import { appendMessage, createPendingMessage, markMessageFailed, removeMessage, replaceMessage } from '@/lib/utils';
import type { CachedMessage, MessagePages, PhotoInput } from '@/types/message.types';
import { MessagePayload, ServerResponse, User } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function useSendMessage(textInput: string) {
  const queryClient = useQueryClient();

  const sendMessage = useMutation<
    MessagePayload,
    Error,
    {
      text: string;
      photoInput: PhotoInput[];
      conversationId: string;
      retryId?: string;
    },
    { pendingId?: string }
  >({
    async mutationFn({ text, photoInput, conversationId }) {
      const { data: response } = await axiosInstance.post<ServerResponse<MessagePayload>>('/message', {
        conversationId,
        text: text ? text : textInput,
        photos: photoInput,
      });

      return response.data;
    },
    async onMutate({ text, photoInput, conversationId, retryId }) {
      const queryKey = ['conversation', 'messages', conversationId];
      const sender = queryClient.getQueryData<User>(['user', 'session']);
      if (!sender || !queryClient.getQueryData(queryKey)) return {};

      await queryClient.cancelQueries({ queryKey });

      const pendingMessage = createPendingMessage({
        conversationId,
        sender,
        text: text ? text : textInput,
        photos: photoInput,
        resending: Boolean(retryId),
      });
      queryClient.setQueryData<MessagePages>(
        queryKey,
        (prev) => prev && appendMessage(retryId ? removeMessage(prev, retryId) : prev, pendingMessage),
      );

      return { pendingId: pendingMessage.id };
    },
    onSuccess: (messagePayload, { conversationId }, context) => {
      const newMessage: CachedMessage = { ...messagePayload, conversation: messagePayload.conversation.id };
      if (context?.pendingId) newMessage.clientKey = context.pendingId;

      queryClient.setQueryData<MessagePages>(
        ['conversation', 'messages', conversationId],
        (prev) => prev && replaceMessage(prev, context?.pendingId, newMessage),
      );
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
  return { sendMessage };
}
