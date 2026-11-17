"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn, getConversationName, getNicknameNoticeText, getTimeIntervalText, isGroupChat } from "@/lib/utils";
import { Conversation } from "@repo/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import ConversationAvatar from "../ConversationAvatar";

export default function HomeConversation({ conversation }: { conversation: Conversation }) {
  const { session } = useAuth();
  const pathname = usePathname();

  const { conversationName, seen, timeIntervalText } = useMemo(() => {
    let conversationName = "";
    let seen: boolean;
    let timeIntervalText = "";

    if (!session)
      return {
        conversationName,
        seen: seen!,
        timeIntervalText,
      };
    conversationName = getConversationName(conversation, session.user?.id);

    if (session.user?.id === conversation.messages[0].sender.id) {
      seen = true;
    } else {
      seen = conversation.messages[0]?.seenBy.some((user) => user.id === session.user?.id);
    }

    timeIntervalText = getTimeIntervalText(conversation.messages[0].dateCreated);

    return {
      conversationName,
      seen: seen!,
      timeIntervalText,
    };
  }, [session, conversation]);

  const textMessage = useMemo(() => {
    if (!conversation || !session.user) return;
    const [lastMessage] = conversation.messages;
    let name = "";
    let text = "";

    if (lastMessage.notice)
      return getNicknameNoticeText({
        notice: lastMessage.notice,
        actorId: lastMessage.sender.id,
        actorName: lastMessage.sender.displayName,
        targetName:
          conversation.members.find((member) => member.id === lastMessage.notice?.user)?.displayName ?? "someone",
        currentUserId: session.user.id,
      });

    // Name the sender when it isn't obvious: you anywhere, or anyone in a group chat.
    if (lastMessage.sender.id === session.user.id) name = "you";
    else if (isGroupChat(conversation, session.user?.id)) {
      name = conversation.nicknames.find((nickname) => nickname.user === lastMessage.sender.id)?.value || "";

      if (!name) name = lastMessage.sender.displayName;
    }

    text += name;

    if (Boolean(lastMessage.photos.length)) {
      if (lastMessage.photos.length > 1) text += " sent some photos";
      else text += " sent a photo";
    } else {
      if (name) text += ": ";
      text += lastMessage.text;
    }
    return text.trim();
  }, [conversation, session.user]);

  return (
    <Link
      key={conversation.id}
      className={cn(
        "flex items-center justify-start gap-2 w-full h-fit p-2  rounded-sm relative hover:bg-muted cursor-pointer",
        pathname.startsWith("/conversation/" + conversation.id) && "bg-muted",
      )}
      href={"/conversation/" + conversation.id}
    >
      {!seen && <span className="absolute top-1 right-1 aspect-square h-4 w-auto bg-primary rounded-full"></span>}
      <ConversationAvatar conversation={conversation} currentUserId={session.user?.id} />
      <div className="flex flex-col items-start justify-start w-full min-w-0">
        <span className="font-semibold truncate max-w-full">{conversationName}</span>
        <div
          className={cn(
            "flex items-center justify-between gap-2 text-xs w-full",
            seen ? "text-muted-foreground" : "font-semibold",
          )}
        >
          <p className="truncate min-w-0">{textMessage}</p>
          <p className="shrink-0">{timeIntervalText}</p>
        </div>
      </div>
    </Link>
  );
}
