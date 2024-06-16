"use client";
import useServerUrl from "@/components/hooks/useServerUrl";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { DirectConversation } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import {
  WebSocketSeverMessage,
  WebsocketDirectMessageType,
} from "@/lib/types/websocket-type";
import { cn } from "@/lib/utils";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DirectMessages() {
  const server_url = useServerUrl();
  const { data } = useSession();
  const { toast } = useToast();
  const websocket = useWebsocket();
  const [direct_conversation, setDirectConversation] = useState<
    DirectConversation[]
  >([]);

  async function getDirectConversations() {
    try {
      const response = await fetch(
        server_url + "/get/v1/direct-conversation/" + data?.user.id
      );

      const response_json = (await response.json()) as ServerResponse;

      if (response_json.status !== "OK") {
        toast({
          title: "Oops! something went wrong.",
          description: response_json.message,
        });
        return;
      }

      setDirectConversation(response_json.data as DirectConversation[]);
    } catch (error) {
      throw error;
    }
  }
  useEffect(() => {
    if (data) getDirectConversations();
  }, [data]);

  useEffect(() => {
    websocket?.addEventListener("message", async (websocket_message) => {
      const message = JSON.parse(
        websocket_message.data
      ) as WebSocketSeverMessage;

      const payload = message.payload as WebsocketDirectMessageType;
      if (message.type === "send-direct-message") {
        switch (payload.type) {
          case "TEXT": {
            const msg = direct_conversation.find(
              (d_msg) =>
                d_msg.messages![0].receiver_id === payload.receiver_id &&
                d_msg.messages![0].sender_id === payload.sender_id
            );

            if (!msg) {
              await getDirectConversations();
              return;
            }
            setDirectConversation((prev) =>
              prev.filter(
                (msg) =>
                  msg.messages![0].receiver_id === payload.receiver_id &&
                  msg.messages![0].sender_id === payload.sender_id
              )
            );
            setDirectConversation((prev) => [
              { ...msg!, messages: [payload!] },
              ...prev,
            ]);
            break;
          }
          default:
            return;
        }
      }
    });
  }, [websocket]);
  return (
    <div className="flex flex-col space-y-5 mx-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">Direct messages</p>
        <Button variant="ghost" className="p-1 h-fit" type="button">
          <PencilSquareIcon className="h-4" />
        </Button>
      </div>
      <div className="relative my-5">
        <Input id="search" placeholder="find conversation" autoComplete="off" />
        <Label
          htmlFor="search"
          className="absolute top-1/2 right-3 -translate-y-1/2"
        >
          <MagnifyingGlassIcon className="h-5" />
        </Label>
      </div>
      <ScrollArea className="h-[35dvh] my-2">
        <div className="mx-1 space-y-1">
          {direct_conversation.map((dc) => (
            <Link
              key={dc.id}
              href={
                "/" +
                data?.user.user_name +
                "/dm/" +
                (dc.user1_id === data?.user.id ? dc.user2_id : dc.user1_id)
              }
              as={
                "/" +
                data?.user.user_name +
                "/dm/" +
                (dc.user1_id === data?.user.id ? dc.user2_id : dc.user1_id)
              }
              prefetch
            >
              <Button
                variant="ghost"
                className="space-x-5 w-full h-fit overflow-x-clip"
              >
                <Avatar>
                  <AvatarImage
                    src={
                      data?.user.id === dc.user1_id
                        ? dc.user2!.profile_photo?.photo_url
                        : dc.user1!.profile_photo?.photo_url
                    }
                    alt={
                      data?.user.id === dc.user1_id
                        ? dc.user2!.display_name.slice(0, 1).toUpperCase()
                        : dc.user1!.display_name.slice(0, 1).toUpperCase()
                    }
                  />
                  <AvatarFallback>
                    {data?.user.id === dc.user1_id
                      ? dc.user2!.display_name.slice(0, 1).toUpperCase()
                      : dc.user1!.display_name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex flex-col items-start text-ellipsis">
                  <h1 className="font-bold">
                    {data?.user.id === dc.user1_id
                      ? dc.user2!.display_name
                      : dc.user1!.display_name}
                  </h1>
                  {dc.messages!.length > 0 && (
                    <p
                      className={cn(
                        "text-xs truncate w-[10rem] text-start",
                        dc.messages![0].sender_id === data?.user.id
                          ? "text-slate-500"
                          : dc.messages![0].seen
                          ? "text-slate-500"
                          : "text-secondary-foreground"
                      )}
                    >
                      {dc.messages![0].type === "TEXT"
                        ? dc.messages![0].text_message?.content
                        : "null"}
                    </p>
                  )}
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
