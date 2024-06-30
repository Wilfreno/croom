"use client";

import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Room } from "@/lib/types/client-types";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddRoomMember from "./AddRoomMember";

export default function RoomSideBar() {
  const [room, setRoom] = useState<Room>();

  const params = useParams<{ room_id: string }>();
  const http_request = useHTTPRequest();

  useEffect(() => {
    if (!params.room_id) return;

    async function getRoom() {
      try {
        setRoom((await http_request.GET("/v1/room/" + params.room_id)) as Room);
      } catch (error) {
        throw error;
      }
    }

    getRoom();
  }, [params]);
  console.log(room);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-fit py-1 rounded border-x-0 group"
        >
          <div className="flex items-center space-x-3 truncate w-[18rem]">
            <Avatar>
              <AvatarImage
                src={room?.photo!.url}
                alt={room?.name.slice(0, 1).toUpperCase()}
              />
              <AvatarFallback className="group-hover:bg-primary">
                {room?.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="truncate w-full">{room?.name}</p>
          </div>
          <ChevronUpDownIcon className="h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[17rem]"></DropdownMenuContent>
    </DropdownMenu>
  );
}
