"use client";
import useUserAgent from "@/components/hooks/useUserAgent";
import ConversationHeader from "@/components/page/main/conversation/ConversationHeader";
import ConversationMessageInput from "@/components/page/main/conversation/ConversationMessageInput";
import ConversationMessages from "@/components/page/main/conversation/ConversationMessages";
import MainContent from "@/components/page/main/MainContent";
import { useAuth } from "@/components/providers/AuthProvider";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Block, Conversation, User } from "@/lib/types/server-data-types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function Page() {
  const { on_mobile } = useUserAgent();
  const { session } = useAuth();
  const params = useParams<{ id: string }>();

  const { data: is_open } = useQuery({
    queryKey: ["sidebar", "info", "open", on_mobile],
    queryFn: () => !on_mobile,
  });

  const { data: query_response } = useQuery({
    enabled: !!session,
    ...getConvoOptions(params.id),
  });

  if (
    query_response &&
    query_response.status !== "OK" &&
    query_response.status !== "BLOCKED"
  )
    throw new Error(query_response.message);

  useQuery({
    enabled: !!session.user?.id && !!query_response,
    queryKey: ["conversation", "info", query_response],
    queryFn: () => {
      let conversation: Conversation;
      let last_online = "";
      let photo_url: string;
      let conversation_name = "";
      let status: User["status"] | null = null;

      if (query_response?.status === "OK") {
        conversation = query_response.data as Conversation;
      } else {
        conversation = (query_response?.data as Block).conversation;
      }
      if (conversation.is_group_chat) {
        photo_url = conversation.photo?.url || "";
        conversation_name = conversation.name;
      } else {
        const other_user = conversation.members.find(
          (member) => member.id !== session.user?.id
        );
        if (!other_user)
          return { photo_url: "", conversation_name: "", status: null, last_online };

        status = other_user.status;
        photo_url = other_user.photo?.url || "";

        conversation_name = conversation.nicknames.find(
          (nickname) => nickname.user === other_user.id
        )!.value;
        if (!conversation_name) conversation_name = other_user.display_name;

        if (other_user.status === "OFFLINE") {
          const last_online_date = new Date(other_user.last_online);
          const now = new Date();

          const last_online_in_seconds = Math.floor(
            (now.getTime() - last_online_date.getTime()) / 1000
          );
          const minutes = 60;
          const hour = 60 * 60;
          const day = 60 * 60 * 24;

          if (last_online_in_seconds > day) {
            last_online = Math.floor(last_online_in_seconds / day) + " day(s) ago";
          } else if (last_online_in_seconds > hour && last_online_in_seconds < day) {
            last_online = Math.floor(last_online_in_seconds / hour) + " hour(s) ago";
          } else if (last_online_in_seconds > minutes && last_online_in_seconds < hour) {
            last_online = Math.floor(last_online_in_seconds / minutes) + " minute(s) ago";
          } else {
            last_online = last_online_in_seconds + " second(s) ago";
          }
        }
      }
      return {
        photo_url,
        conversation_name,
        status,
        last_online,
      };
    },
    placeholderData: {
      photo_url: undefined!,
      conversation_name: "",
      status: null,
      last_online: "",
    },
  });

  if (on_mobile && is_open) return null;
  return (
    <MainContent className="grid grid-rows-[auto_1fr_auto]">
      <ConversationHeader />
      <ConversationMessages />
      <ConversationMessageInput />
    </MainContent>
  );
}
