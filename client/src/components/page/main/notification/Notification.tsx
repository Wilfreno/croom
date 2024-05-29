"use client";

import { NotificationType } from "@/lib/types/notification-type";
import useFriendrequest from "../../../hooks/useFriendrequest";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import FriendRequestNotification from "./FriendRequestNotification";

export default async function Notification() {
  const { friend_requests, accept, decline } = useFriendrequest();
  const [notifications, setNotifications] = useState<NotificationType[]>();


  useEffect(() => {
    if(friend_requests) 
  },[friend_requests])
  return (
    <div className="grid grid-rows-[auto_1fr] space-y-5">
      <p className="font-bold text-sm">Notifications</p>
      <ScrollArea className="h-full">
        <ul>
          {notifications?.map((notification, index) => {
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
        </ul>
      </ScrollArea>
    </div>
  );
}
