"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import useWebsocket from "@/components/hooks/useWebsocket";
import { useEffect, useState } from "react";
import { NotificationType } from "@/lib/types/notification-type";
import FriendRequestNotification from "./FriendRequestNotification";
import { WebSocketSeverMessage } from "@/lib/types/websocket-type";

export default function NotificationList({
  server_notifications,
}: {
  server_notifications: NotificationType[];
}) {
  const websocket = useWebsocket();

  const [notifications, setNotifications] =
    useState<NotificationType[]>(server_notifications);

  useEffect(() => {
    websocket?.addEventListener("message", (socket) => {
      const message: WebSocketSeverMessage = JSON.parse(socket.data);

      setNotifications((prev) => [
        ...prev,
        message.payload as NotificationType,
      ]);
    });
  }, [websocket]);

  return (
    <div className="grid grid-rows-[auto_1fr] space-y-5">
      <p className="font-bold text-sm">Notifications</p>
      <ScrollArea className="h-full">
        <div>
          {notifications.map((notification, index) => {
            if (notification.type === "friend-request") {
              return (
                <FriendRequestNotification
                  key={index}
                  notification={notification}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  index={index}
                />
              );
            }
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
