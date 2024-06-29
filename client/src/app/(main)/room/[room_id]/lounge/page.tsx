"use client";

import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import LoungeMsg from "@/components/page/room/LoungeMessage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { LoungeMessage } from "@/lib/types/client-types";
import {
  WebSocketMessage,
  WebsocketUserType,
} from "@/lib/types/websocket-type";
import websocketMessage from "@/lib/websocket-message";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function Page() {
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [online_members, setOnlineMember] = useState<WebsocketUserType[]>([]);
  const [sending_message_list, setSendingMessage] = useState<LoungeMessage[]>(
    []
  );
  const [text_message, setTextMessage] = useState("");

  const params = useParams<{ id: string }>();
  const websocket = useWebsocket();
  const { data } = useSession();
  const textarea_ref = useRef<HTMLTextAreaElement>(null);
  const http_request = useHTTPRequest();

  async function sendTextMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const sending_message: LoungeMessage = {
        id: data?.user.id!,
        lounge_id: params.id,
        sender_id: data?.user.id!,
        type: "TEXT",
        text_message: {
          content: text_message,
          id: "",
          date_created: new Date(),
        },
        sender: data?.user!,
        date_created: new Date(),
      };

      setTextMessage("");
      setSendingMessage((prev) => [...prev, sending_message]);

      const message = (await http_request.POST("/v1/room/lounge/message/text", {
        sender_id: data?.user.id,
        room_id: params.id,
        text: sending_message.text_message?.content,
      })) as LoungeMessage;

      setSendingMessage((prev) =>
        prev.filter((msg) => msg.date_created !== sending_message.date_created)
      );
      setMessages((prev) => [...prev, message]);

      websocket?.send(
        websocketMessage("send-lounge-message", {
          sender: {
            id: data?.user.id!,
            display_name: data?.user.display_name!,
            user_name: data?.user.user_name!,
            profile_photo: {
              url: data?.user.profile_photo?.url!,
            },
          },
          text_message: message.text_message,
        })
      );

      if (textarea_ref.current) textarea_ref.current.style.height = "auto";
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    if (!params || !params.id) return;

    async function getMessages() {
      try {
        setMessages(
          (await http_request.GET(
            "/v1/room/lounge/messages/" + params.id
          )) as LoungeMessage[]
        );
      } catch (error) {
        throw error;
      }
    }

    getMessages();
  }, [params]);

  useEffect(() => {
    if (!websocket || !data) return;

    websocket.send(
      websocketMessage("join-lounge", {
        id: data.user.id!,
        display_name: data.user.display_name,
        user_name: data.user.user_name,
        profile_photo: data.user.profile_photo,
      } as WebsocketUserType)
    );

    websocket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data) as WebSocketMessage;

      switch (message.type) {
        case "join-lounge": {
          const payload = message.payload as WebsocketUserType;
          setOnlineMember((prev) =>
            [...prev!, payload].toSorted((a, b) =>
              a.display_name.localeCompare(b.display_name)
            )
          );
          break;
        }
        case "leave-lounge": {
          const payload = message.payload as WebsocketUserType;

          setOnlineMember((prev) => prev.toSpliced(prev.indexOf(payload), 1));
          break;
        }
      }
    });
  }, [websocket, data]);

  return (
    <section className="grow bg-secondary grid grid-rows-[1fr_auto]">
      <div
        className="overflow-y-auto scroll-m-0 scroll-p-0 w-full"
        style={{
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <div className="space-y-2 w-full">
          {messages?.map((message, index) => (
            <LoungeMsg
              key={message.id}
              index={index}
              message={message}
              messages_length={messages.length}
              setMessages={setMessages}
            />
          ))}

          {sending_message_list.map((msg, index) => (
            <div
              key={msg.id}
              className="flex items-end ml-auto space-x-3 relative"
              onLoad={(e) =>
                index === sending_message_list.length - 1 &&
                e.currentTarget.scrollIntoView({ behavior: "instant" })
              }
            >
              <div className="max-w-[30vw] p-2 rounded-lg shadow-md cursor-default  bg-primary-foreground text-sm text-wrap whitespace-pre-line">
                <p className="break-all">
                  {msg.type === "TEXT" && msg.text_message?.content}
                </p>
              </div>
              <Avatar>
                <AvatarImage
                  src={data?.user.profile_photo?.url}
                  alt={data?.user.display_name.slice(0, 1).toUpperCase()}
                />
                <AvatarFallback>
                  {data?.user.display_name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="absolute top-full left-0 text-xs mx-5">sending</p>
            </div>
          ))}
        </div>
      </div>
      <form
        onSubmit={sendTextMessage}
        autoComplete="off"
        className="flex items-end space-x-5 w-[95%] mx-auto my-3 bg-primary-foreground py-3 px-2 h-fit border rounded-lg shadow-md "
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
          placeholder="Message"
          rows={1}
          className="resize-none border-none focus-visible:ring-0 leading-4 margin-b-0 border bg-secondary h-auto max-h-[40dvh] overflow-y-auto "
          value={text_message}
          onChange={(e) => {
            setTextMessage(e.currentTarget.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
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
    </section>
  );
}
