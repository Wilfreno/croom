"use client";

import { NotificationType } from "@/lib/types/notification-type";
import useFriendrequest from "../../../hooks/useFriendrequest";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import FriendRequestNotification from "./FriendRequestNotification";

export default function Notification() {
  const { friend_requests, accept, decline } = useFriendrequest();
  const [notifications, setNotifications] = useState<NotificationType[]>();

  useEffect(() => {
    let n: NotificationType[] = [];
    if (friend_requests) {
      for (let i = 0; i < friend_requests.length; i++) {
        n.push({
          type: "friend-request",
          content: friend_requests[i],
          message:
            friend_requests[i].sender.display_name +
            " want to make friends with you.",
        });
      }
    }

    setNotifications(
      n.toSorted(
        (a, b) =>
          new Date(a.content?.created_at!).getTime() -
          new Date(b.content?.created_at!).getTime()
      )
    );
  }, [friend_requests]);

  console.log("N::", notifications);
  console.log("F::", friend_requests);
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
