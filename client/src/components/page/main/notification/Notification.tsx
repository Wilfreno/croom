"use client";

import { NotificationType } from "@/lib/types/notification-type";
import useFriendRequestHandler from "../../../hooks/useFriendRequestHandler";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import FriendRequestNotification from "./FriendRequestNotification";

export default function Notification() {
  const { friend_request_list, accept, decline } = useFriendRequestHandler();
  const [notifications, setNotifications] = useState<NotificationType[]>();

  useEffect(() => {
    let n: NotificationType[] = [];

    for (let i = 0; i < friend_request_list.length; i++) {
      n.push({
        type: "friend-request",
        content: friend_request_list[i],
        message:
          friend_request_list[i].sender.display_name +
          " want to make friends with you.",
      });
    }

    setNotifications(
      n.toSorted(
        (a, b) =>
          new Date(a.content?.date_created!).getTime() -
          new Date(b.content?.date_created!).getTime()
      )
    );
  }, [friend_request_list]);

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
                  decline={decline}
                  accept={accept}
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
