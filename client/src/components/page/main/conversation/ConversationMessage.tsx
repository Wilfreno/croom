"use client";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PATCHRequest } from "@/lib/server/requests";
import { Message } from "@/lib/types/server-data-types";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
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
  const { session } = useAuth();
  const query_client = useQueryClient();
  const div_ref = useRef<HTMLDivElement>(null);

  const { show_time_interval, time_interval_text, quick_message_placement } =
    useMemo(() => {
      const date_sent = new Date(message.date_created);
      const now = new Date();
      const relative_date_in_seconds = Math.floor(
        (now.getTime() - date_sent.getTime()) / 1000
      );

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

        if (
          prev_message.sender.id === message.sender.id &&
          prev_message_date_sent_in_seconds < minute
        ) {
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
      message.text
        .split(/([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u)
        .filter(Boolean).length === 1;

    return only_emoji;
  }, [message.text]);

  const text_style = useMemo(() => {
    let style = "font-sans py-2 max-w-96 break-words";

    const is_sender = message.sender.id === session.user?.id;
    if (no_text) {
      style += " h-fit  text-4xl";

      if (is_sender) style += " justify-self-end";
      else style += " justify-self-start";
    } else style += " bg-primary rounded-lg px-3";

    if (!!quick_message_placement) {
      style += is_sender ? " rounded-l-lg" : " rounded-r-lg";
      switch (quick_message_placement) {
        case "FIRST": {
          style += is_sender ? "rounded-tr-lg rounded-br" : " rounded-tl-lg rounded-bl";
          break;
        }
        case "MIDDLE": {
          style += is_sender ? "  rounded-r" : " rounded-l";
          break;
        }
        case "LAST": {
          style += is_sender ? " rounded-br-lg rounded-tr" : "  rounded-tl";
          if (!message.photos.length) style += " rounded-bl-lg";
          break;
        }
      }
    }

    if (!!message.photos.length)
      style += is_sender
        ? " rounded-l-lg rounded-tr-lg rounded-br"
        : " rounded-r-lg rounded-tl-lg rounded-bl";

    return style;
  }, [no_text, session.user, quick_message_placement, message]);

  const photo_style = useMemo(() => {
    let style = "h-fit w-full rounded-sm overflow-hidden grid";

    if (!!message.photos.length) style += " mt-1";
    if (message.photos.length > 1) style += " bg-primary p-1";
    else if (message.photos.length === 1) style += " border shadow-sm";
    if (message.text)
      style +=
        message.sender.id === session.user?.id
          ? " rounded-l-lg rounded-tr-lg rounded-br"
          : " rounded-r-lg rounded-tl-lg rounded-bl";

    style += " grid-cols-" + Math.min(message.photos.length, 3);
    return style;
  }, [message]);

  const seen = useMutation({
    mutationFn: async () => {
      try {
        const { status, message: response_message } = await PATCHRequest(
          "/v1/message/" + message.id + "/seen_by",
          {
            action: "ADD",
          }
        );

        if (status !== "OK") throw new Error(response_message);
        query_client.invalidateQueries({
          exact: true,
          queryKey: [session.user?.id, "conversations"],
        });
      } catch (error) {
        throw error;
      }
    },
  });

  useEffect(() => {
    if (!is_last_message) return;
    div_ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    seen.mutate();
  }, [is_last_message]);

  return (
    <span className="grid gap-3">
      {show_time_interval && (
        <div
          key={message.id + "time_interval"}
          className="text-center text-xs text-muted-foreground font-medium"
        >
          {time_interval_text}
        </div>
      )}
      <div
        key={message.id}
        ref={div_ref}
        className={cn(
          "gap-2 w-full max-w-[25vw] grid",
          message.sender.id === session.user?.id
            ? "ml-auto"
            : "grid-cols-[auto_1fr] items-end"
        )}
      >
        {message.sender.id !== session.user?.id && (
          <Avatar
            className={cn(
              quick_message_placement && quick_message_placement !== "LAST" && "opacity-0"
            )}
          >
            <AvatarImage src={message.sender.photo?.url} />
            <AvatarFallback>
              <UserRound className="h-1/2 w-auto" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="grid">
          {!!message.text && (
            <div className={text_style}>
              <span>{message.text}</span>
            </div>
          )}
          <div className={photo_style}>
            {message.photos.map((photo) => (
              <div key={photo.id} className="relative w-full h-full">
                <Image
                  src={photo.url}
                  height={photo.height}
                  width={photo.width}
                  className="object-cover w-full h-auto"
                  alt=""
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </span>
  );
}
