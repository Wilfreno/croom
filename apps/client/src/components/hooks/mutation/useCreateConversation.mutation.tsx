import { axiosInstance } from '@/lib/axios-instance';
import { Conversation, Photo, ServerResponse } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import useComposeMessage from './useComposeMessage.mutation';

export default function useCreateConversation({ photos, members }: { photos: Partial<Photo>[]; members: string[] }) {
  const { sendMessage } = useComposeMessage({
    photos,
  });

  const createNewConversation = useMutation<Conversation, Error, { text: string }>({
    async mutationFn() {
      const { data: response } = await axiosInstance.post<ServerResponse<Conversation>>('/conversation', {
        members,
      });

      return response.data;
    },
    onSuccess(conversation, { text }) {
      sendMessage.mutate({ conversationId: conversation.id, text, members });
    },
  });
  return { createNewConversation };
}
