"use client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import UserAvatar from "../UserAvatar";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { GETRequest } from "@/lib/server/requests";
import Link from "next/link";
import { Conversation } from "@/lib/types/server-data-types";

export default function HomeActiveConversations() {
  const { data: session } = useSession();

  const { data: active_conversations } = useQuery({
    enabled: !!session,
    queryKey: [session, "active friends"],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Conversation[]>("/v1/user/active-conversation");

        if (status !== "OK") throw new Error(message);

        return data;
      } catch (error) {
        throw error;
      }
    },
    placeholderData: [],
  });

  return (
    <section className="w-full flex flex-col gap-1">
      <p className="font-bold">Active Conversations</p>
      <ScrollArea className="w-80 min-h-20 py-2 pb-3">
        <div className="flex items-center gap-2 mx-auto">
          {active_conversations!.map((conversation) => (
            <Link key={conversation.id} href={"/conversation/" + conversation.id}>
              <div className="flex flex-col items-center gap-1 h-fit w-fit">
                <UserAvatar
                  is_online
                  src={conversation.is_group_chat ? conversation.photo?.url : conversation.members[0].photo?.url}
                />
                <span className="text-xs font-medium w-14 truncate">
                  {conversation.is_group_chat ? conversation.name : conversation.members[0].display_name}
                </span>
              </div>
            </Link>
          ))}
          <ScrollBar orientation="horizontal" />
        </div>
      </ScrollArea>
    </section>
  );
}
