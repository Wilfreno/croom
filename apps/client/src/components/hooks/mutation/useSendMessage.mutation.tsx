import { axiosInstance } from '@/lib/axios-instance';
import { Message, ServerResponse } from '@repo/types';
import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

export default function useSendMessage(textInput: string) {
  const queryClient = useQueryClient();

  const sendMessage = useMutation<
    Message,
    Error,
    {
      text: string;
      photoInput: { key: string; url: string; width: number; height: number }[];
      conversationId: string;
    }
  >({
    async mutationFn({ text, photoInput, conversationId }) {
      const { data: response } = await axiosInstance.post<ServerResponse<Message>>('/message', {
        conversationId,
        text: text ? text : textInput,
        photos: photoInput,
      });

      return response.data;
    },
    onSuccess: (data, { conversationId }) => {
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
            result: index === prev.pages.length - 1 ? [...result, data] : result,
          })),
        };
      });
     
    },
  });
  return { sendMessage };
}
