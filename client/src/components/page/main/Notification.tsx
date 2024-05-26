"use client";
import useWebsocket from "@/components/hooks/useWebsocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerResponse } from "@/lib/types/sever-response";
import { FriendRequest } from "@/lib/types/user-type";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Notification = { type: "friend-request"; content: FriendRequest }[];

export default function Notification() {
  const server_url = process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER!;
  if (!server_url)
    throw new Error(
      "NEXT_PUBLIC_DEVELOPMENT_SERVER is missing from your .env.local file"
    );
  const { data } = useSession();
  const websocket = useWebsocket();

  const [notifications, setNotifications] = useState<Notification>([]);

  useEffect(() => {
    websocket?.addEventListener("message", (socket) => {
      console.log(socket);
    });
  }, [websocket]);

  useEffect(() => {
    async function getFriendRequest() {
      const response = await fetch(
        server_url + "/get/friend-request/" + data?.user.id
      );
      const response_json = (await response.json()) as ServerResponse;

      if (response_json.status !== "OK") return;

      const response_data = response_json.data as FriendRequest[];
      let fr: Notification = [];

      for (let i = 0; i < response_data.length; i++) {
        fr.push({
          type: "friend-request",
          content: response_data[i],
        });
      }

      setNotifications((prev) => [...prev, ...fr]);
    }
    if (data) getFriendRequest();
  }, [data]);
  return (
    <div className="grid grid-rows-[auto_1fr] space-y-5">
      <p className="font-bold text-sm">Notifications</p>
      <ScrollArea className="h-full">
        <div>
          {notifications?.map((notification) => {
            if (notification.type === "friend-request") {
              return (
                <div>
                  <div className="flex items-center space-x-5">
                    <Avatar>
                      <AvatarImage
                        src={notification.content.sender.profile_pic.photo_url}
                        alt={notification.content.sender.display_name
                          .slice(0, 1)
                          .toUpperCase()}
                      />
                      <AvatarFallback>
                        {notification.content.sender.display_name
                          .slice(0, 1)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p>{notification.content.sender.display_name}</p>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
