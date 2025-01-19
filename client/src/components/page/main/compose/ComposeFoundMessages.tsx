"use client";

import { GETRequest } from "@/lib/server/requests";
import { Conversation, Message } from "@/lib/types/server-data-types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import ConversationMessage from "../conversation/ConversationMessage";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ComposeFoundMessages() {
  const { session } = useAuth();

  const { data: selected_users } = useQuery<string[][]>({
    queryKey: ["compose", "selected_users"],
    placeholderData: [],
  });

  const { data: found_conversation, isError } = useQuery<Conversation[]>({
    enabled: !!selected_users?.length && !!session.user,
    queryKey: ["conversation", "members", selected_users],
    placeholderData: [],
  });

  const { data: found_messages } = useInfiniteQuery<{
    page_param: number;
    result: Message[];
  }>({
    enabled: !!found_conversation && found_conversation.length === 1,
    queryKey: ["conversation", "messages", found_conversation?.[0]?.id],
    queryFn: async ({ pageParam }) => {
      try {
        const page_param = pageParam as number;
        const {
          data: result,
          status,
          message,
        } = await GETRequest<Message[]>(
          "/v1/conversation/" +
            found_conversation?.[0].id +
            "/messages?page=" +
            page_param
        );

        if (status !== "OK") throw new Error(message);

        return { page_param, result };
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (last_page) => {
      if (last_page.result.length) return last_page.page_param + 1;
      return undefined;
    },
    placeholderData: { pages: [], pageParams: [] },
  });

  return (
    <div className="h-full w-full max-h-[80dvh] flex flex-col gap-px p-1 overflow-y-auto scrollbar scrollbar-thumb-gray-300  scrollbar-track-background">
      <div className="mt-auto">
        {!!found_messages?.pages.length &&
          !isError &&
          found_messages.pages.map((page, pages_index) =>
            page.result.map((message, message_index) => (
              <ConversationMessage
                key={message.id}
                message={message}
                prev_message={page.result[message_index - 1]}
                next_message={page.result[message_index + 1]}
                is_last_message={
                  pages_index === found_messages.pages.length - 1 &&
                  message_index === page.result.length - 1
                }
              />
            ))
          )}
      </div>
    </div>
  );
}
