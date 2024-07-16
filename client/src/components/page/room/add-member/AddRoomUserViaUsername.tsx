"use client";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Notification, RoomInvite, User } from "@/lib/types/client-types";
import websocketMessage from "@/lib/websocket-message";
import { useState } from "react";

export default function AddRoomUserViaUsername({
  room_invite,
}: {
  room_invite: RoomInvite;
}) {
  const [username, setUsername] = useState("");

  const http_request = useHTTPRequest();
  const websocket = useWebsocket();
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const user = (await http_request.GET(
          "/user/username/" + username
        )) as User;
        const notification = (await http_request.POST("/notification", {
          type: "ROOM_INVITE",
          room_invite_id: room_invite?.id,
          receiver_id: user.user_name,
        })) as Notification;

        websocket?.send(websocketMessage("notification", notification!));
      }}
    >
      <div>
        <Label htmlFor="room-invite" className="font-bold text-lg">
          Invite user
        </Label>
        <p className="text-xs "> invite user with their username</p>
      </div>
      <div className="flex items-center space-x-5">
        <Input
          id="room-invite"
          placeholder="username"
          className="h-10"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
        />
        <Button type="submit" disabled={!username}>
          invite
        </Button>
      </div>
    </form>
  );
}
