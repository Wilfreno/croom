"use client";

import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { RoomInvite } from "@/lib/types/client-types";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Page({ params }: { params: { invite_code: string } }) {
  const http_request = useHTTPRequest();
  const { data } = useSession();
  const router = useRouter();
  const room_id = useSearchParams().get("room_id");

  async function acceptInvite() {
    try {
      const room_invite = (await http_request.POST("/v1/room/invite/accept", {
        user_id: data?.user.id,
        room_id,
        invite_code: params.invite_code,
      })) as RoomInvite;

      router.push("/room" + room_invite.room_id + "/lounge");
    } catch (error) {
      throw error;
    }
  }

  async function declineInvite() {
    try {
      await http_request.DELETE("/v1/notification", {
        type: "ROOM_INVITE",
        user_id: data?.user.id,
        room_id,
      });
    } catch (error) {
      throw error;
    }
  }
  return null;
}
