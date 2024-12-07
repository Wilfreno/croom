"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchConversation from "./SearchConversation";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

export default function HomeConversations() {
  const router = useRouter();

  return (
    <section className="h-full grid gap-2">
      <div className="flex items-center justify-between w-full">
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
      <ScrollArea className="h-[65dvh] rounded-sm">
        <div></div>
      </ScrollArea>
    </section>
  );
}
