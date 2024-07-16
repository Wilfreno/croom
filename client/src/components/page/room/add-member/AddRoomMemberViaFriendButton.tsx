import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import LoadingSvg from "@/components/svg/LoadingSvg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Friend, Notification, RoomInvite } from "@/lib/types/client-types";
import websocketMessage from "@/lib/websocket-message";
import { title } from "process";
import { useState } from "react";

export default function AddRoomMemberViaFriendButton({
  friend,
  room_invite,
}: {
  room_invite: RoomInvite;
  friend: Friend;
}) {
  const [sending, setSending] = useState(false);

  const http_request = useHTTPRequest();
  const websocket = useWebsocket();
  const { toast } = useToast();

  async function inviteFriend(receiver_id: string) {
    try {
      setSending(true);
      const notification = (await http_request.POST("/v1/notification", {
        type: "ROOM_INVITE",
        room_invite_id: room_invite?.id,
        receiver_id,
      })) as Notification;

      if (notification)
        websocket?.send(websocketMessage("notification", notification!));

      toast({ title: "Invite sent" });
      setSending(false);
    } catch (error) {
      throw error;
    }
  }

  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={() => inviteFriend(friend.id)}
      className="p-1 space-x-1"
    >
      {sending ? (
        <LoadingSvg className="h-full fill-white" />
      ) : (
        <>
          <Avatar className="aspect-square h-full w-auto">
            <AvatarImage
              src={friend.profile_photo.url}
              alt={friend.display_name.slice(0, 1).toUpperCase()}
            />
            <AvatarFallback>
              {friend.display_name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{friend.display_name}</span>
        </>
      )}
    </Button>
  );
}
