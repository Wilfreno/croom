"use client";

import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { GETRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server-data-types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import ConversationMessage from "./ConversationMessage";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ConversationMessages() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();

  const {
    data: found_conversation,
    isError,
    error,
  } = useQuery(getConvoOptions(params.id));

  const { data: found_messages } = useInfiniteQuery<{
    page_param: number;
    result: Message[];
  }>({
    enabled: !!found_conversation && !!session.user,
    queryKey: ["conversation", "messages", params.id],
    queryFn: async ({ pageParam }) => {
      try {
        const page_param = pageParam as number;
        const {
          data: result,
          status,
          message,
        } = await GETRequest<Message[]>(
          "/v1/conversation/" + params.id + "/messages?page=" + page_param
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

  if (isError) throw error;

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
