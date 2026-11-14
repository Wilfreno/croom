"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn, getConversationName, getTimeIntervalText, isConversationOnline, isGroupChat } from "@/lib/utils";
import { Conversation } from "@repo/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import GroupAvatar from "../GroupAvatar";
import UserAvatar from "../UserAvatar";

export default function HomeConversation({ conversation }: { conversation: Conversation }) {
  const { session } = useAuth();
  const pathname = usePathname();

  const { conversationName, photoUrl, seen, timeIntervalText, isOnline } = useMemo(() => {
    let conversationName = "";
    let photoUrl: string;
    let seen: boolean;
    let timeIntervalText = "";
    let isOnline = false;

    if (!session)
      return {
        conversationName,
        photoUrl: photoUrl!,
        seen: seen!,
        timeIntervalText,
        isOnline: isOnline!,
      };
    conversationName = getConversationName(conversation, session.user?.id);
    if (isGroupChat(conversation, session.user?.id)) {
      photoUrl = conversation.photo?.url as string;
    } else {
      const otherUser = conversation.members[0];

      photoUrl = otherUser?.photo?.url as string;
    }

    if (session.user?.id === conversation.messages[0].sender.id) {
      seen = true;
    } else {
      seen = conversation.messages[0]?.seenBy.some((user) => user.id === session.user?.id);
    }
    isOnline = isConversationOnline(conversation, session.user?.id);

    timeIntervalText = getTimeIntervalText(conversation.messages[0].dateCreated);

    return {
      conversationName,
      photoUrl,
      seen: seen!,
      timeIntervalText,
      isOnline,
    };
  }, [session, conversation]);

  const textMessage = useMemo(() => {
    if (!conversation || !session.user) return;
    const [lastMessage] = conversation.messages;
    let name = "";
    let text = "";

    // Name the sender when it isn't obvious: you anywhere, or anyone in a group chat.
    if (lastMessage.sender.id === session.user.id) name = "you";
    else if (isGroupChat(conversation, session.user?.id)) {
      name = conversation.nicknames.find((nickname) => nickname.user === lastMessage.sender.id)?.value || "";

      if (!name) name = lastMessage.sender.displayName;
    }

    text += name;

    if (!!lastMessage.photos.length) {
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
      {isGroupChat(conversation, session.user?.id) ? (
        <GroupAvatar conversation={conversation} currentUserId={session.user?.id} />
      ) : (
        <UserAvatar src={photoUrl} isOnline={isOnline} />
      )}
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
