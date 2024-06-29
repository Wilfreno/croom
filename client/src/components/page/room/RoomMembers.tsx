"use client";

import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import { useToast } from "@/components/ui/use-toast";
import { RoomMember } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import {
  WebSocketMessage,
  WebsocketRoomMemberType,
  WebsocketUserType,
} from "@/lib/types/websocket-type";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface OnlineMember extends RoomMember {
  online?: boolean;
}

export default function RoomMembers() {
  const [room_members, setRoomMembers] = useState<OnlineMember[]>();
  const member_status_ref = useRef(new Map<OnlineMember["id"], number>());

  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const websocket = useWebsocket();
  const http_request = useHTTPRequest();

  useEffect(() => {
    if (!params.id) return;

    async function getRoomMembers() {
      try {
        setRoomMembers(
          (await http_request.GET(
            "/room/" + params.id + "/members"
          )) as RoomMember[]
        );
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
      const message = JSON.parse(data) as WebSocketMessage;
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
            prev?.toSpliced(member_status_ref.current.get(payload.id)!, 1, {
              ...prev[member_status_ref.current.get(payload.id)!],
              online: false,
            })
          );
        }
      }
    });
  }, [websocket]);

  return <></>;
}
