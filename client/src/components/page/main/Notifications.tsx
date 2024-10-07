"use client";
import { useWebsocket } from "@/components/providers/WebsocketProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GETRequest, PATCHRequest } from "@/lib/server/requests";
import { Notification, ServerResponse } from "@/lib/types/server";
import { WebSocketMessage } from "@/lib/types/websocket";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Snail } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import NotFound from "../error/NotFound";

export default function Notifications() {
  const websocket = useWebsocket();
  const query_client = useQueryClient();

  const { data: notifications, error } = useQuery<
    Notification[],
    { status: ServerResponse["status"]; message: string }
  >({
    queryKey: ["notifications"],
    queryFn: async () => {
      const {
        data: results,
        status,
        message,
      } = await GETRequest<Notification[]>("/v1/user/notifications");

      if (status !== "OK") {
        throw { status, message };
      }

      return results;
    },
    placeholderData: [],
  });

  const notificationSeenMutation = useMutation<
    void,
    Error,
    { index: number; id: string }
  >({
    mutationFn: async ({ id }) => {
      const { status, message } = await PATCHRequest("/v1/notification/seen", {
        id,
        seen: true,
      });

      if (status !== "OK") {
        toast.error(message);
        throw new Error(message);
      }
    },
    onSuccess: (v, { index }) => {
      query_client.setQueryData<Notification[]>(["notifications"], (prev) => {
        if (!prev) return [];

        return prev.toSpliced(index, 0, { ...prev[index], seen: true });
      });
    },
  });

  useEffect(() => {
    if (!websocket) return;

    websocket.addEventListener("message", (event) => {
      const parsed_data = JSON.parse(event.data) as WebSocketMessage;

      if (parsed_data.type === "notification") {
        query_client.setQueryData<Notification[]>(["notifications"], (prev) => [
          ...prev!,
          parsed_data.payload as Notification,
        ]);
      }
    });
  }, [websocket]);

  const not_seen_length = useMemo(() => {
    if (!notifications) return 0;

    return notifications?.filter((n) => !n.seen).length;
  }, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full relative">
          <Bell className="h-5 w-auto" />
          <div
            className={cn(
              not_seen_length
                ? "flex h-fit w-fit px-2 py-px text-xs font-medium absolute -top-1 right-1/2 translate-x-1/2 bg-red-500 rounded-full"
                : "hidden"
            )}
          >
            {not_seen_length}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {notifications?.length ? (
          <ScrollArea className="h-[40dvh]">
            <DropdownMenuGroup className="h-full grid overflow-y-auto">
              {notifications?.map((notification, index) => {
                switch (notification.type) {
                  case "INVITE": {
                    return (
                      <Link
                        key={notification.id}
                        href={
                          "/lobby/" +
                          "invite/" +
                          notification.invite.id +
                          "?token=" +
                          notification.invite.token
                        }
                        onClick={() =>
                          notificationSeenMutation.mutate({
                            index,
                            id: notification.id,
                          })
                        }
                      >
                        <Button
                          variant={notification.seen ? "secondary" : "ghost"}
                          className="h-[10dvh] gap-4 w-72 justify-start"
                        >
                          <Avatar>
                            <AvatarImage src={notification.lobby.photo.url} />
                            <AvatarFallback>
                              <Snail className="h-1/2 w-auto stroke-1 stroke-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-left text-wrap gap-1">
                            You are invited to join{" "}
                            <strong>{notification.lobby.name}</strong>
                          </span>
                        </Button>
                      </Link>
                    );
                  }
                }
              })}
            </DropdownMenuGroup>
          </ScrollArea>
        ) : (
          <span className="flex flex-col items-center justify-items-center p-10 text-xs text-muted-foreground">
            <Snail className="h-12 w-auto stroke-1 stroke-muted-foreground" />
            There&apos;s nothing here
          </span>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
