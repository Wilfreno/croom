"use client";

import { Button } from "@/components/ui/button";
import { getConvoOptions } from "@/lib/react-query/prefetch-query-options";
import { Block, Conversation, User } from "@/lib/types/server-data-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ellipsis } from "lucide-react";
import { useParams } from "next/navigation";
import UserAvatar from "../UserAvatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ConversationHeader() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const query_client = useQueryClient();

  const { data: info_sidebar_is_open } = useQuery({
    queryKey: ["sidebar", "info", "open"],
    placeholderData: true,
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

  const { data: conversation_info } = useQuery({
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

  const { photo_url, conversation_name, status, last_online } = conversation_info!;
  return (
    <section className="w-full border-b flex items-center justify-between p-3 relative gap-4 shadow-lg h-full">
      <div className="flex items-center gap-4">
        <UserAvatar src={photo_url} is_online={status === "ONLINE"} />
        <div>
          <p className="font-medium truncate max-w-96">{conversation_name}</p>
          {!!last_online && (
            <p className="text-xs font-medium text-muted-foreground">{last_online}</p>
          )}
        </div>
      </div>
      <Button
        className="aspect-square h-fit w-auto rounded-full p-1"
        onClick={() =>
          query_client.setQueryData<boolean>(["sidebar", "info", "open"], (prev) => !prev)
        }
      >
        <Ellipsis
          className={cn("w-auto", info_sidebar_is_open === true ? "h-2" : "h-4")}
        />
      </Button>
    </section>
  );
}
