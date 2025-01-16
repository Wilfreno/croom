"use client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import UserAvatar from "../UserAvatar";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { GETRequest } from "@/lib/server/requests";
import Link from "next/link";
import { Conversation } from "@/lib/types/server-data-types";
import { useAuth } from "@/components/providers/SessionProvider";

export default function HomeActiveConversations() {
  const { session } = useAuth();

  const { data: active_conversations } = useQuery({
    enabled: !!session,
    queryKey: [session.user?.id, "active", "conversations"],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Conversation[]>(
          "/v1/user/active-conversation"
        );
=======
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
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

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
<<<<<<< HEAD
          {active_conversations?.map((conversation) => (
=======
          {active_conversations!.map((conversation) => (
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
            <Link key={conversation.id} href={"/conversation/" + conversation.id}>
              <div className="flex flex-col items-center gap-1 h-fit w-fit">
                <UserAvatar
                  is_online
<<<<<<< HEAD
                  src={
                    conversation.is_group_chat
                      ? conversation.photo?.url
                      : conversation.members[0].photo?.url
                  }
                />
                <span className="text-xs font-medium w-14 truncate">
                  {conversation.is_group_chat
                    ? conversation.name
                    : conversation.members[0].display_name}
=======
                  src={conversation.is_group_chat ? conversation.photo?.url : conversation.members[0].photo?.url}
                />
                <span className="text-xs font-medium w-14 truncate">
                  {conversation.is_group_chat ? conversation.name : conversation.members[0].display_name}
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
