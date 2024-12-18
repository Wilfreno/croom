"use client";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PATCHRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { Avatar } from "@radix-ui/react-avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";

export default function ConversationMessage({
  message,
  prev_message,
  next_message,
  is_last_message,
}: {
  message: Message;
  prev_message?: Message;
  next_message?: Message;
  is_last_message: boolean;
}) {
  const { data: session } = useSession();
  const query_client = useQueryClient();
  const div_ref = useRef<HTMLDivElement>(null);

  const { show_time_interval, time_interval_text, quick_message_placement } = useMemo(() => {
    const date_sent = new Date(message.date_created);
    const now = new Date();
    const relative_date_in_seconds = Math.floor((now.getTime() - date_sent.getTime()) / 1000);

    const minute = 60;
    const hour = 60 * 60;
    const day = 60 * 60 * 24;

    let quick_message_placement: "FIRST" | "MIDDLE" | "LAST";
    let show_time_interval = false;
    let time_interval_text = "";

    if (!!next_message && next_message.sender.id === message.sender.id) {
      const next_message_date_sent = new Date(next_message.date_created);
      const next_message_date_sent_in_seconds = Math.floor(
        (next_message_date_sent.getTime() - date_sent.getTime()) / 1000
      );
      if (next_message_date_sent_in_seconds < minute) {
        if (!!prev_message && prev_message.sender.id === message.sender.id) {
          const prev_message_date_sent = new Date(prev_message.date_created);
          const prev_message_date_sent_in_seconds = Math.floor(
            (date_sent.getTime() - prev_message_date_sent.getTime()) / 1000
          );
          if (prev_message_date_sent_in_seconds < minute) {
            quick_message_placement = "MIDDLE";
          } else {
            quick_message_placement = "FIRST";
          }
        }
      }
    }

    if (!!prev_message) {
      const prev_message_date_sent = new Date(prev_message.date_created);
      const prev_message_date_sent_in_seconds = Math.floor(
        (date_sent.getTime() - prev_message_date_sent.getTime()) / 1000
      );

      if (prev_message.sender.id === message.sender.id && prev_message_date_sent_in_seconds < minute) {
        if (!!next_message && next_message.sender.id === message.sender.id) {
          const next_message_date_sent = new Date(next_message.date_created);
          const next_message_date_sent_in_seconds = Math.floor(
            (next_message_date_sent.getTime() - date_sent.getTime()) / 1000
          );
          if (next_message_date_sent_in_seconds < minute) {
            quick_message_placement = "MIDDLE";
          } else {
            quick_message_placement = "LAST";
          }
        } else {
          quick_message_placement = "LAST";
        }
      }
      if (prev_message_date_sent_in_seconds > minute) {
        show_time_interval = true;

        if (relative_date_in_seconds > day * 7) {
          time_interval_text += new Intl.DateTimeFormat("en-US", {
            month: "long",
          }).format(date_sent);

          time_interval_text +=
            " " +
            new Intl.DateTimeFormat("en-US", {
              day: "numeric",
            }).format(date_sent);
        }
        if (relative_date_in_seconds > hour * 24) {
          if (relative_date_in_seconds > hour * 24 * 2) {
            time_interval_text +=
              " " +
              new Intl.DateTimeFormat("en-US", {
                weekday: "long",
              }).format(date_sent);

            time_interval_text +=
              " " +
              new Intl.DateTimeFormat("en-US", {
                year: "numeric",
              }).format(date_sent);
          } else {
            time_interval_text += " Yesterday,";
          }
        }

        time_interval_text +=
          " " +
          new Intl.DateTimeFormat("en-US", {
            minute: "2-digit",
            hour: "2-digit",
          }).format(date_sent);
      }
    } else {
      show_time_interval = true;

      if (relative_date_in_seconds > day * 7) {
        time_interval_text += new Intl.DateTimeFormat("en-US", {
          month: "long",
        }).format(date_sent);

        time_interval_text +=
          " " +
          new Intl.DateTimeFormat("en-US", {
            day: "numeric",
          }).format(date_sent);
      }
      if (relative_date_in_seconds > hour * 24) {
        if (relative_date_in_seconds > hour * 24 * 2) {
          time_interval_text +=
            " " +
            new Intl.DateTimeFormat("en-US", {
              weekday: "long",
            }).format(date_sent);

          time_interval_text +=
            " " +
            new Intl.DateTimeFormat("en-US", {
              year: "numeric",
            }).format(date_sent);
        } else {
          time_interval_text += " Yesterday,";
        }
      }

      time_interval_text +=
        " " +
        new Intl.DateTimeFormat("en-US", {
          minute: "2-digit",
          hour: "2-digit",
        }).format(date_sent);
    }

    return {
      quick_message_placement: quick_message_placement!,
      show_time_interval,
      time_interval_text,
    };
  }, [message, prev_message, next_message]);

  const no_text = useMemo(() => {
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
    const only_emoji =
      emojiRegex.test(message.text) &&
      message.text.split(/([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u).filter(Boolean).length === 1;

    return only_emoji;
  }, [message.text]);

  const photo_style = useMemo(() => {
    let style = "h-fit w-auto rounded-sm overflow-hidden grid";

    if (message.photos.length > 1) style += " bg-primary p-1";
    if (message.text) style += " rounded-l-lg rounded-br-lg rounded-tr";

    style += " grid-cols-" + Math.min(message.photos.length, 3);
    return style;
  }, [message.photos]);

  useQuery({
    enabled: is_last_message,
    queryKey: ["message", message.id],
    queryFn: async (id) => {
      try {
        const { status, message } = await PATCHRequest("/v1/message/" + id + "/seen_by", { action: "ADD" });

        if (status !== "OK") throw new Error(message);
        query_client.invalidateQueries({ exact: true, queryKey: [session?.user.id, "conversations"] });
      } catch (error) {
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!is_last_message) return;
    div_ref.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [is_last_message, session]);

  return (
    <>
      {show_time_interval && (
        <div key={message.id + "time_interval"} className="text-center text-xs text-muted-foreground font-medium my-6">
          {time_interval_text}
        </div>
      )}
      <div
        key={message.id}
        ref={div_ref}
        className={cn("gap-4 grid bg-red-500", message.sender.id !== session?.user.id ? "" : "justify-items-end")}
      >
        {message.sender.id !== session?.user.id && (
          <Avatar>
            <AvatarImage src={message.sender.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="max-w-[25vw] text-white  grid gap-1 bg-green-500">
          {!!message.text && (
            <p
              className={cn(
                "font-sans py-2",
                no_text ? "bg-transparent text-4xl" : "bg-primary rounded-lg px-3",
                !!quick_message_placement! &&
                  quick_message_placement === "FIRST" &&
                  "rounded-l-lg rounded-tr-lg rounded-br",
                !!quick_message_placement! && quick_message_placement === "MIDDLE" && "rounded-l-lg rounded-r",
                !!quick_message_placement! &&
                  quick_message_placement === "LAST" &&
                  "rounded-l-lg rounded-br-lg rounded-tr",
                message.photos.length > 0 && "rounded-l-lg rounded-tr-lg rounded-br"
              )}
            >
              {message.text}
            </p>
          )}
          <div className={photo_style}>
            {message.photos.map((photo) => (
              <Image
                key={photo.id}
                src={photo.url}
                height={photo.height}
                width={photo.width}
                className="object-cover w-full h-auto"
                alt=""
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
