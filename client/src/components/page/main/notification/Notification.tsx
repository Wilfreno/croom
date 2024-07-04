"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import FriendRequestNotification from "./FriendRequestNotification";
import { useAppSelector } from "@/lib/redux/store";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { Notification } from "@/lib/types/client-types";
import RoomInviteNotification from "./RoomInviteNotification";

export default function Notifications() {
  const websocket_notification = useAppSelector(
    (state) => state.notification_reducer
  );

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { data } = useSession();
  const http_request = useHTTPRequest();

  useEffect(() => {
    if (!data) return;

    async function getNotifications() {
      try {
        setNotifications(
          (await http_request.GET(
            "/user/" + data?.user.id + "/notifications"
          )) as Notification[]
        );
      } catch (error) {
        throw error;
      }
    }
  }, [data]);

  useEffect(() => {
    if (websocket_notification.length < 1) return;

    setNotifications((prev) => [...prev, ...websocket_notification]);
  }, [websocket_notification]);

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
