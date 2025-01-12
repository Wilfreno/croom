"use client";
import { Conversation } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import UserAvatar from "../UserAvatar";
import Link from "next/link";

export default function HomeConversation({ convo }: { convo: Conversation }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const { conversation_name, photo_url, seen, time_interval_text, is_online } = useMemo(() => {
    let conversation_name = "";
    let photo_url: string;
    let seen: boolean;
    let time_interval_text = "";
    let is_online = false;

    if (!session)
      return {
        conversation_name,
        photo_url: photo_url!,
        seen: seen!,
        time_interval_text,
        is_online: is_online!,
      };

    if (convo.is_group_chat) {
      conversation_name = convo.name;
      photo_url = convo.photo?.url;
    } else {
      const other_user = convo.members.find((member) => member.id !== session?.user.id)!;
      photo_url = other_user.photo!.url;

      if (convo.nicknames.some((nickname) => nickname.user === other_user.id && nickname.value)) {
        conversation_name = convo.nicknames.find((nickname) => nickname.user === other_user.id)!.value;
      } else {
        conversation_name = other_user.display_name;
      }
    }

    if (session.user.id === convo.messages[0].sender.id) {
      seen = true;
    } else {
      seen = convo.messages[0]?.seen_by.some((user) => user.id === session?.user.id);
    }
    is_online = convo.members.some((user) => user.status === "ONLINE");

    const date_sent = new Date(convo.messages[0].date_created);
    const now = new Date();
    const relative_date_in_seconds = Math.floor((now.getTime() - date_sent.getTime()) / 1000);

    const day = 60 * 60 * 24;

    if (relative_date_in_seconds < day) {
      time_interval_text +=
        " " +
        new Intl.DateTimeFormat("en-US", {
          minute: "2-digit",
          hour: "2-digit",
        }).format(date_sent);
    } else {
      time_interval_text += Math.floor(relative_date_in_seconds / day) + " d";
    }

    return {
      conversation_name,
      photo_url,
      seen: seen!,
      time_interval_text,
      is_online,
    };
  }, [session, convo]);

  return (
    <Link
      key={convo.id}
      className={cn(
        "flex items-center justify-start gap-2 w-full h-fit p-2  rounded-sm relative hover:bg-muted cursor-pointer",
        pathname.startsWith("/conversation/" + convo.id) && "bg-muted"
      )}
      href={"/conversation/" + convo.id}
    >
      {!seen && <span className="absolute top-1 right-1 aspect-square h-4 w-auto bg-primary rounded-full"></span>}
      <UserAvatar src={photo_url} is_online={is_online} />
      <div className="flex flex-col items-start justify-start w-full">
        <span className="font-semibold truncate max-w-60">{conversation_name}</span>
        <div
          className={cn(
            "flex items-center justify-between text-xs w-full",
            seen ? "text-muted-foreground" : "font-semibold"
          )}
        >
          <p className="truncate  max-w-56">
            {convo.messages[0]?.sender.id === session?.user.id && <span>you: </span>}
            <span>
              {convo.messages[0].text ? convo.messages[0].text : convo.messages[0].sender.id + " sent a photo"}
            </span>
          </p>
          <p>{time_interval_text}</p>
        </div>
      </div>
    </Link>
  );
}
