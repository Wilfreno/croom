import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Friend, Notification, RoomInvite } from "@/lib/types/client-types";
import { useEffect, useState } from "react";
import AddFriend from "../../main/AddFriend";
import { useSession } from "next-auth/react";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import websocketMessage from "@/lib/websocket-message";
import AddRoomMemberViaFriendButton from "./AddRoomMemberViaFriendButton";

export default function AddRoomMemberViaFriends({
  room_invite,
}: {
  room_invite: RoomInvite;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);

  const { data } = useSession();
  const http_request = useHTTPRequest();
  const websocket = useWebsocket();

  useEffect(() => {
    if (!data) return;
    async function getFriends() {
      try {
        setFriends(
          (await http_request.GET(
            "/v1/user/" + data?.user.id + "/friends"
          )) as Friend[]
        );
      } catch (error) {
        throw error;
      }
    }

    getFriends();
  }, [data]);

  return (
    <div className="space-y-5 relative">
      <span className="space-y-1">
        <h1 className="text-lg font-bold ">Invite your friends</h1>
        <h2 className="text-xs">
          Make your room lively by inviting your friends
        </h2>
      </span>
      {friends.length > 0 ? (
        <ScrollArea className="p-2 h-[15dvh] rounded-lg bg-primary-foreground w-full">
          <div className="flex flex-wrap gap-3">
            {friends.map((friend) => (
              <AddRoomMemberViaFriendButton
                key={friend.id}
                friend={friend}
                room_invite={room_invite}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="p-5 h-[15dvh] grid rounded-lg bg-primary-foreground w-full">
          <span className="self-center justify-self-center">
            <AddFriend />
          </span>
        </div>
      )}
    </div>
  );
}
