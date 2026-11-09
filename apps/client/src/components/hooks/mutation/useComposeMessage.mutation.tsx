import { axiosInstance } from '@/lib/axios-instance';
import { Message, Photo, ServerResponse } from '@repo/types';
import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

export default function useComposeMessage({ photos }: { photos: Partial<Photo>[] }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const sendMessage = useMutation<Message, AxiosError, { conversationId: string; text: string; members: string[] }>({
    mutationFn: async ({ conversationId, text, members }) => {
      const { data: response } = await axiosInstance.post<ServerResponse<Message>>('/message', {
        conversationId,
        text,
        photos,
        members,
      });

      return response.data;
    },
    onSuccess: async (newMessage, { conversationId }) => {
      queryClient.setQueryData<
        | InfiniteData<
            {
              pageParam: number;
              result: Message[];
            },
            unknown
          >
        | undefined
      >(['conversation', 'messages', conversationId], (prev) => {
        if (!prev) return;

        return {
          ...prev,
          pages: prev.pages.map(({ pageParam, result }, index) => ({
            pageParam,
            result: index === prev.pages.length - 1 ? [...result, newMessage] : result,
          })),
        };
      });
      router.push(`/conversation/${conversationId ? conversationId : newMessage.conversation.id}`);
    },
  });
  return {
    sendMessage,
  };
}
