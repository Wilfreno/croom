"use client";

import useServerUrl from "@/components/hooks/useServerUrl";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import { useToast } from "@/components/ui/use-toast";
import { RoomMember } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import {
  WebsocketMessage,
  WebsocketRoomMemberType,
  WebsocketUserType,
} from "@/lib/types/websocket-type";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface OnlineMember extends RoomMember {
  online?: boolean;
}

export default function RoomMembers() {
  const params = useParams<{ id: string }>();
  const server_url = useServerUrl();
  const { toast } = useToast();
  const websocket = useWebsocket();

  const [room_members, setRoomMembers] = useState<OnlineMember[]>();
  const member_status_ref = useRef(new Map<OnlineMember["id"], number>());

  useEffect(() => {
    if (!params.id) return;

    async function getRoomMembers() {
      try {
        const response = await fetch(
          server_url + "/room/" + params.id + "/members"
        );

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! something went wrong",
            description: response_json.message,
          });
          return;
        }
        setRoomMembers(response_json.data as RoomMember[]);
      } catch (error) {
        throw error;
      }
    }

    getRoomMembers();
  }, [params]);

  useEffect(() => {
    if (!room_members) return;
    room_members.forEach((member, index) => {
      member_status_ref.current.set(member.id, index);
    });
  }, [room_members]);

  useEffect(() => {
    if (!websocket) return;

    websocket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data) as WebsocketMessage;
      switch (message.type) {
        case "online-room-member": {
          const payload = message.payload as WebsocketRoomMemberType;
          setRoomMembers((prev) =>
            prev?.toSpliced(member_status_ref.current.get(payload.id)!, 1, {
              ...prev[member_status_ref.current.get(payload.id)!],
              online: true,
            })
          );
          break;
        }
        case "offline": {
          const payload = message.payload as WebsocketUserType;
          setRoomMembers((prev) =>
            prev?.toSpliced(member_status_ref.current.get(payload.user.id)!, 1, {
              ...prev[member_status_ref.current.get(payload.user.id)!],
              online: false,
            })
          );
        }
      }
    });
  }, [websocket]);

  return <></>;
}
