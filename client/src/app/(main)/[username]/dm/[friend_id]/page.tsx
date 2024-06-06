"use client";

import useServerUrl from "@/components/hooks/useServerUrl";
import useWebsocket from "@/components/hooks/useWebsocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Message, User } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import {
  WebSocketSeverMessage,
  WebsocketClientMessage,
} from "@/lib/types/websocket-type";
import { cn } from "@/lib/utils";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function page() {
  const server_url = useServerUrl();
  const params = useParams<{ username: string; friend_id: string }>();
  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { data } = useSession();
  const websocket = useWebsocket();

  const [text_message, setTextMessage] = useState("");
  const [friend, setFriend] = useState<User>();
  const [textarea_height, setTextareaHeight] = useState<number>();
  const [direct_message, setDirectMessages] = useState<Message[]>([]);

  async function sendTextMessage() {
    try {
      const response = await fetch(
        server_url + "/v1/create/direct-message/text",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender_id: data?.user.id,
            receiver_id: params.friend_id,
            text: text_message,
          }),
        }
      );

      const response_json = (await response.json()) as ServerResponse;

      if (response_json.status !== "OK") {
        toast({
          title: "Oops! Something went wrong.",
          description: response_json.message,
        });
        return;
      }

      const message = response_json.data as Message;

      setDirectMessages((prev) => [...prev, message]);

      websocket?.send(
        JSON.stringify({
          type: "send-direct-message",
          payload: message,
        } as WebsocketClientMessage)
      );
    } catch (error) {
      throw error;
    }
  }

  console.log("dm::", direct_message);

  useEffect(() => {
    if (!params.friend_id || data) return;

    async function getFriend() {
      try {
        const response = await fetch(
          server_url + "/v1/get/user/" + params.friend_id
        );

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! Something went wrong.",
            description: response_json.message,
          });
          return;
        }

        setFriend(response_json.data as User);
      } catch (error) {
        throw error;
      }
    }

    async function getDirectMessages() {
      try {
        const response = await fetch(
          server_url +
            "/v1/get/direct-message?user_id=" +
            data?.user.id +
            "&friend_id=" +
            params.friend_id
        );

        const response_json = (await response.json()) as ServerResponse;

        console.log("AAAA::", response_json);

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! Something went wrong.",
            description: response_json.message,
          });
          return;
        }

        setDirectMessages(response_json.data as Message[]);
      } catch (error) {
        throw error;
      }
    }
    getDirectMessages();
    getFriend();
  }, [params.friend_id, data]);

  useEffect(() => {
    if (!websocket) return;

    websocket.addEventListener("message", (socket) => {
      const message = JSON.parse(socket.data) as WebSocketSeverMessage;

      const payload = message.payload as Message;
      if (
        message.type === "send-direct-message" &&
        payload.sender_id === params.friend_id
      ) {
        setDirectMessages((prev) => [...prev, payload]);
      }
    });
  }, [websocket]);

  return (
    <div className="grow flex flex-col bg-secondary">
      <div className="px-5 flex items-center py-2 w-full shadow-lg space-x-5 border-b bg-primary-foreground">
        <Avatar>
          <AvatarImage
            src={friend?.profile_photo?.photo_url}
            alt={friend?.display_name?.slice(0, 1).toUpperCase()}
          />
          <AvatarFallback>
            {friend?.display_name?.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="">
          <p className="text-xl font-bold">{friend?.display_name}</p>
          <p className="text-xs">{friend?.user_name}</p>
        </div>
      </div>
      <div className="grow grid-flow-row space-y-5 place-items-end">
        {direct_message.map((dm) => (
          <div
            key={dm.id}
            className={cn(
              "flex items-end",
              data?.user.id === dm.sender_id
                ? "justify-self-end"
                : "justify-self-start"
            )}
          >
            <Avatar>
              <AvatarImage
                src={
                  dm.sender_id === data?.user.id
                    ? data.user.profile_photo?.photo_url
                    : friend?.profile_photo?.photo_url
                }
                alt={
                  dm.sender_id === data?.user.id
                    ? data.user.display_name.slice(0, 1).toUpperCase()
                    : friend?.display_name.slice(0, 1).toUpperCase()
                }
              />
              <AvatarFallback>
                {dm.sender_id === data?.user.id
                  ? data.user.display_name.slice(0, 1).toUpperCase()
                  : friend?.display_name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="w-fit p-2 rounded-lg bg-secondary ">
              {dm.type === "text" && dm.text_message?.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-end space-x-5 w-[95%] mx-auto my-3 bg-primary-foreground py-3 px-2 h-fit border rounded-lg">
        <Button
          className="aspect-square h-fit rounded-full p-1 "
          variant="ghost"
        >
          <PaperClipIcon className="h-6" />
        </Button>
        <Textarea
          ref={textarea_ref}
          style={{
            height: textarea_height ? textarea_height + "px" : undefined,
          }}
          placeholder="Message"
          rows={1}
          className="resize-none border-none focus-visible:ring-0 leading-4 margin-b-0 border bg-secondary h-auto max-h-[40dvh] overflow-y-auto "
          value={text_message}
          onChange={(e) => {
            setTextMessage(e.currentTarget.value);
            if (!e.currentTarget.value)
              textarea_ref.current!.style.height = "auto";
            setTextareaHeight(e.currentTarget.scrollHeight);
          }}
        />
        <Button
          className="aspect-square h-fit rounded-full p-1"
          variant="ghost"
          disabled={!text_message}
          onClick={sendTextMessage}
        >
          <PaperAirplaneIcon className="h-6" />
        </Button>
      </div>
    </div>
  );
}
