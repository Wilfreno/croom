"use client";
import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RoomInvite } from "@/lib/types/client-types";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddRoomUserViaUsername from "./add-member/AddRoomUserViaUsername";
import AddRoomMemberViaLink from "./add-member/AddRoomMemberViaLink";
import AddRoomMemberViaFriends from "./add-member/AddRoomMemberViaFriends";

export default function AddRoomMember() {
  const [room_invite, setRoomInvite] = useState<RoomInvite>();
  const [invite_link, setInviteLink] = useState("");

  const { data } = useSession();
  const http_request = useHTTPRequest();
  const params = useParams<{ room_id: string }>();

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

  useEffect(() => {
    if (!data) return;
    async function getRoomInvite() {
      try {
        const invite = (await http_request.GET(
          "/v1/room/" + params.room_id + "/invite"
        )) as RoomInvite;

        if (!invite) {
          await generateRoomInvite();
        } else {
          setRoomInvite(invite);
        }
      } catch (error) {
        throw error;
      }
    }
    getRoomInvite();
  }, [data]);

  useEffect(() => {
    if (!room_invite) return;

    setInviteLink(
      window.location.href +
        "/room/invite/" +
        room_invite?.id +
        "?room_code=" +
        room_invite?.code
    );
  }, [room_invite]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="w-[90%] my-8 ">
          Add Member <PlusIcon className="h-5 mx-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="space-y-5 relative">
          <DialogClose className="absolute -top-3 -right-3">
            <Button
              variant="ghost"
              className="  aspect-square h-fit w-auto p-0"
            >
              <XMarkIcon className="h-6 stroke-2" />
            </Button>
          </DialogClose>
          <AddRoomMemberViaFriends room_invite={room_invite!} />
          <AddRoomMemberViaLink
            invite_link={invite_link}
            generateRoomInvite={generateRoomInvite}
          />
          <AddRoomUserViaUsername room_invite={ room_invite!} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
