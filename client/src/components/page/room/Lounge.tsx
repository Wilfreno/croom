"use client";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import { SpeakerLoudIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

export default function Lounge() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={(e) => setOpen(e)}>
      <CollapsibleTrigger asChild>
        <Button
          variant={pathname.includes("/lounge") ? "secondary" : "ghost"}
          className="h-fit py-1 w-full rounded justify-start space-x-3"
        >
          {open ? (
            <ChevronLeftIcon className="h-3" />
          ) : (
            <ChevronDownIcon className="h-3" />
          )}
          <p className="font-bold"># LOUNGE</p>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col ml-5 my-1 space-y-1">
        <Link
          href={"/room/" + params.id + "/lounge/general"}
          as={"/room/" + params.id + "/lounge/general"}
          prefetch
        >
          <Button
            variant={pathname.endsWith("/general") ? "secondary" : "ghost"}
            className="justify-start rounded space-x-3 h-fit py-1 w-full"
          >
            <ChatBubbleOvalLeftEllipsisIcon className="h-4" />
            <p>GENERAL CHAT</p>
          </Button>
        </Link>
        <Link
          href={"/room/" + params.id + "/lounge/voice-chat"}
          as={"/room/" + params.id + "/lounge/voice-chat"}
          prefetch
        >
          <Button
            variant={pathname.endsWith("/voice-chat") ? "secondary" : "ghost"}
            className="justify-start rounded space-x-3 h-fit py-1 w-full"
          >
            <SpeakerLoudIcon className="h-4" />
            <p>VOICE CHAT</p>
          </Button>
        </Link>
      </CollapsibleContent>
    </Collapsible>
  );
}
