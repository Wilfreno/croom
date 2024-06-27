"use client";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Friend, Notification, RoomInvite } from "@/lib/types/client-types";
import websocketMessage from "@/lib/websocket-message";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
        <Button type="button"> Add Member</Button>
      </DialogTrigger>
      <DialogContent>
        <div></div>
        <form>
          <Input />
          <Button type="button">invite</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
