"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import FriendRequestNotification from "./FriendRequestNotification";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { Notification } from "@/lib/types/client-types";
import RoomInviteNotification from "./RoomInviteNotification";
import { useAppSelector } from "@/lib/redux/store";

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ws_friend_request = useAppSelector((state) => state.ws_friend_request);

  const { data } = useSession();
  const http_request = useHTTPRequest();

  useEffect(() => {
    if (!data) return;
    async function getNotifications() {
      try {
        setNotifications(
          (await http_request.GET(
            "/v1/user/" + data?.user.id + "/notifications"
          )) as Notification[]
        );
      } catch (error) {
        throw error;
      }
    }

    getNotifications();
  }, [data]);

  useEffect(() => {
    console.log(ws_friend_request);
    if (!ws_friend_request) return;

    setNotifications((prev) => [
      ...prev,
      {
        id: ws_friend_request.id,
        friend_request: ws_friend_request,
        type: "FRIEND_REQUEST",
      },
    ]);
  }, [ws_friend_request]);

  return (
    <div className="grid grid-rows-[auto_1fr] space-y-5">
      <p className="font-bold text-sm">Notifications</p>
      <ScrollArea className="h-full">
        <ul>
          {notifications?.map((notification, index) => {
            switch (notification.type) {
              case "FRIEND_REQUEST": {
                return (
                  <FriendRequestNotification
                    key={index}
                    friend_request={notification.friend_request!}
                  />
                );
              }
              case "ROOM_INVITE": {
                return (
                  <RoomInviteNotification
                    room_invite={notification.room_invite!}
                  />
                );
              }
              default:
                break;
            }
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}
