"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchConversation from "./SearchConversation";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
<<<<<<< HEAD
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
=======
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
import { GETRequest } from "@/lib/server/requests";
import { Conversation } from "@/lib/types/server-data-types";
import { useMemo } from "react";
import HomeConversation from "./HomeConversation";
<<<<<<< HEAD
import { useAuth } from "@/components/providers/SessionProvider";

export default function HomeConversations() {
  const router = useRouter();
  const { session } = useAuth();

  const { data: conversations } = useQuery({
    enabled: !!session,
    queryKey: [session.user?.id, "conversations"],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Conversation[]>(
          "/v1/user/conversations"
        );
=======

export default function HomeConversations() {
  const router = useRouter();
  const { data: session } = useSession();

  const { data: conversations } = useQuery({
    enabled: !!session,
    queryKey: [session?.user.id, "conversations"],
    queryFn: async () => {
      try {
        const { data, status, message } = await GETRequest<Conversation[]>("/v1/user/conversations");
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

        if (status !== "OK") throw new Error(message);
        return data;
      } catch (error) {
<<<<<<< HEAD
=======
        toast.error((error as Error).message);
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
        throw error;
      }
    },
    placeholderData: [],
  });
<<<<<<< HEAD

  const { data: conversation_search } = useQuery<Conversation[]>({
    queryKey: ["conversation", "search"],
  });
=======
  const { data: conversation_search } = useQuery<Conversation[]>({ queryKey: ["conversation", "search"] });
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60

  const to_display_conversation = useMemo(() => {
    let to_display: Conversation[] = [];

    if (conversation_search) to_display = conversation_search;
    else to_display = conversations!;

    return to_display;
  }, [conversations, conversation_search]);

<<<<<<< HEAD
  console.log(to_display_conversation);

=======
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
  return (
    <section className="h-full grid gap-2">
      <div className="flex items-center justify-between w-full mb-2">
        <p className="font-bold">Conversations</p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
<<<<<<< HEAD
              <Button
                className="aspect-square h-fit w-auto rounded-full p-2"
                onClick={() => router.push("/compose")}
              >
=======
              <Button className="aspect-square h-fit w-auto rounded-full p-2" onClick={() => router.push("/compose")}>
>>>>>>> 48594df86b677d2b1222ce8220c48d5ef0822e60
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
        <div className="grid gap-1">
          {to_display_conversation.map((convo) => (
            <HomeConversation key={convo.id} convo={convo} />
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
