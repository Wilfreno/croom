"use client";

import { useWebsocketInstance } from "@/components/Websocket";
import useServerUrl from "@/components/hooks/useServerUrl";
import UserMessage from "@/components/page/main/UserMessage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DirectMessage, User } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import {
  WebSocketSeverMessage,
  WebsocketClientMessage,
} from "@/lib/types/websocket-type";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function Page() {
  const server_url = useServerUrl();
  const params = useParams<{ username: string; friend_id: string }>();
  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { data } = useSession();
  const websocket = useWebsocketInstance();

  const [text_message, setTextMessage] = useState("");
  const [friend, setFriend] = useState<User>();
  const [textarea_height, setTextareaHeight] = useState<number>();
  const [direct_message, setDirectMessages] = useState<DirectMessage[]>([]);
  const [sending_message_list, setSendingMessage] = useState<DirectMessage[]>(
    []
  );

  async function sendTextMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const sending_message: DirectMessage = {
        id: data?.user.id!,
        conversation_id: data?.user.id!,
        sender_id: data?.user.id!,
        type: "TEXT",
        text_message: {
          id: "",
          content: text_message,
          date_created: new Date(),
        },
        sender: data?.user!,
        seen: false,
        receiver_id: friend?.id!,
        receiver: friend!,
        date_created: new Date(),
      };

      setSendingMessage((prev) => [...prev, sending_message]);

      const response = await fetch(
        server_url + "/create/v1/direct-conversation/message/text",
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

      const message = response_json.data as DirectMessage;

      setSendingMessage((prev) =>
        prev.filter(
          (msg) =>
            msg.text_message?.content !== sending_message.text_message!.content!
        )
      );
      setDirectMessages((prev) => [...prev, message]);

      websocket?.send(
        JSON.stringify({
          type: "send-direct-message",
          payload: message,
        } as WebsocketClientMessage)
      );

      setTextMessage("");
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    if (!params.friend_id || !data) return;

    async function getFriend() {
      try {
        const response = await fetch(
          server_url + "/get/v1/user/" + params.friend_id
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
            "/get/v1/direct-conversation/messages?user_id=" +
            data?.user.id +
            "&friend_id=" +
            params.friend_id +
            "&page=1"
        );

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! Something went wrong.",
            description: response_json.message,
          });
          return;
        }
        setDirectMessages(response_json.data as DirectMessage[]);
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

      const payload = message.payload as DirectMessage;
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
      <ScrollArea className="grow">
        <div className="flex flex-col space-y-5 justify-end p-5">
          {direct_message.map((dm, index) => (
            <UserMessage
              key={index}
              user={data?.user!}
              friend={friend!}
              message={dm}
              dm_length={direct_message.length}
              index={index}
            />
          ))}
          {sending_message_list.map((dm, index) => (
            <UserMessage
              key={index}
              user={data?.user!}
              friend={friend!}
              message={dm}
              dm_length={direct_message.length}
              index={index}
            />
          ))}
        </div>
      </ScrollArea>
      <form
        onSubmit={sendTextMessage}
        autoComplete="off"
        className="flex items-end space-x-5 w-[95%] mx-auto my-3 bg-primary-foreground py-3 px-2 h-fit border rounded-lg"
      >
        <Button
          type="button"
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
          type="submit"
          className="aspect-square h-fit rounded-full p-1"
          variant="ghost"
          disabled={!text_message}
        >
          <PaperAirplaneIcon className="h-6" />
        </Button>
      </form>
    </div>
  );
}
