"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchConversation from "./SearchConversation";
import { Button } from "@/components/ui/button";
import { SquarePen, UserRound } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { GETRequest } from "@/lib/server/requests";
import { Conversation, User } from "@/lib/types/server-data-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export default function HomeConversations() {
  const router = useRouter();
  const { data: session } = useSession();
  const pathname = usePathname();

  const { data: conversations } = useQuery({
    enabled: !!session,
    queryKey: [session?.user.id, "conversations"],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Conversation[]>("/v1/user/conversations");

        if (status !== "OK") throw new Error(message);
        return data;
      } catch (error) {
        toast.error((error as Error).message);
        throw error;
      }
    },
    placeholderData: [],
  });
  const { data: conversation_search } = useQuery<Conversation[]>({ queryKey: ["conversation", "search"] });

  const to_display_conversation = useMemo(() => {
    let to_display: Conversation[] = [];

    if (conversation_search) to_display = conversation_search;
    else to_display = conversations!;

    return to_display;
  }, [conversations, conversation_search]);

  return (
    <section className="h-full grid gap-2">
      <div className="flex items-center justify-between w-full mb-2">
        <p className="font-bold">Conversations</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="aspect-square h-fit w-auto rounded-full p-2" onClick={() => router.push("/compose")}>
                <SquarePen className="h-4 w-auto" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Compose</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <SearchConversation />
      <ScrollArea className="h-[65dvh]">
        {to_display_conversation.map((convo) => {
          let conversation_name = convo.name;
          let other_user: User;
          let photo_url: string | undefined = convo.photo?.url;
          let seen = convo.messages[0]?.sender.id === session?.user.id;

          if (!seen && convo.messages[0]?.seen_by.some((user) => user.id === session?.user.id)) seen = true;

          if (!convo.is_group_chat) {
            other_user = convo.members.find((member) => member.id !== session?.user.id)!;
            conversation_name = other_user.display_name;
            photo_url = other_user.photo?.url;
          }

          const date_sent = new Date(convo.messages[0].date_created);
          const now = new Date();
          const relative_date_in_seconds = Math.floor((now.getTime() - date_sent.getTime()) / 1000);

          const day = 60 * 60 * 24;

          let time_interval_text = "";

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
          return (
            <div
              key={convo.id}
              className={cn(
                "flex items-center justify-start gap-2 w-full h-fit p-2  rounded-sm relative hover:bg-muted cursor-pointer",
                pathname.startsWith("/conversation/" + convo.id) && "bg-muted"
              )}
              onClick={() => router.push("/conversation/" + convo.id)}
            >
              {!seen && (
                <span className="absolute top-1 right-1 aspect-square h-4 w-auto bg-primary rounded-full"></span>
              )}
              <Avatar>
                <AvatarImage src={photo_url} />
                <AvatarFallback>
                  <UserRound className="h-1/2 w-auto" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start justify-start w-full">
                <span className="font-semibold truncate  ">{conversation_name}</span>
                <div
                  className={cn(
                    "flex items-center justify-between text-xs w-full",
                    seen ? "text-muted-foreground" : "font-semibold"
                  )}
                >
                  <p className="truncate  max-w-48">
                    {convo.messages[0]?.sender.id === session?.user.id && <span>you: </span>}
                    <span>
                      {convo.messages[0].text ? convo.messages[0].text : convo.messages[0].sender.id + " sent a photo"}
                    </span>
                  </p>
                  <p>{time_interval_text}</p>
                </div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </section>
  );
}
