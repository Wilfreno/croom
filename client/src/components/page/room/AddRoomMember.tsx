"use client";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Friend, Notification, RoomInvite } from "@/lib/types/client-types";
import websocketMessage from "@/lib/websocket-message";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddFriend from "../main/AddFriend";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

export default function AddRoomMember() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [room_invite, setRoomInvite] = useState<RoomInvite>();

  const { data } = useSession();
  const http_request = useHTTPRequest();
  const params = useParams<{ room_id: string }>();
  const websocket = useWebsocket();

  async function generateRoomInvite() {
    try {
      setRoomInvite(
        (await http_request.POST("/v1/room/invite", {
          room_id: params.room_id,
        })) as RoomInvite
      );
    } catch (error) {
      throw error;
    }
  }

  async function inviteFriend() {
    try {
      const notification = (await http_request.POST("/notification", {
        room_invite_id: room_invite?.id,
        receiver_id: "",
      })) as Notification;

      websocket?.send(websocketMessage("notification", notification!));
    } catch (error) {
      throw error;
    }
  }
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
    async function getRoomInvite() {
      try {
        setRoomInvite(
          (await http_request.GET(
            "/v1/room/" + params.room_id + "/invite"
          )) as RoomInvite
        );
      } catch (error) {
        throw error;
      }
    }
    getFriends();
    getRoomInvite();
  }, [data]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="w-[90%] my-8 ">
          Add Member <PlusIcon className="h-5 mx-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="space-y-5">
        <div className="space-y-5">
          <span className="space-y-1">
            <h1 className="text-lg font-bold ">Invite your friends</h1>
            <h2 className="text-xs">
              Make your room lively by inviting your friends
            </h2>
          </span>
          {friends.length > 0 ? (
            <ScrollArea className="p-5 h-[15dvh] rounded-lg bg-primary-foreground w-full">
              <div className="flex flex-wrap gap-3">
                {friends.map((friend) => (
                  <Button variant="outline">
                    <Avatar>
                      <AvatarImage
                        src={friend.profile_photo.url}
                        alt={friend.display_name.slice(0, 1).toUpperCase()}
                      />
                      <AvatarFallback>
                        {friend.display_name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p>{friend.display_name}</p>
                  </Button>
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
        <form className="space-y-1">
          <Label htmlFor="room-invite" className="font-bold">
            Invite user via username
          </Label>
          <div className="flex items-center space-x-5">
            <Input id="room-invite" placeholder="username" />
            <Button type="button">invite</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
