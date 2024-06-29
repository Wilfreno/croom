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
import { useToast } from "@/components/ui/use-toast";
import { Room } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomSideBar() {
  const [room, setRoom] = useState<Room>();

  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const http_request = useHTTPRequest();

  useEffect(() => {
    if (!params.id) return;
    async function getRoom() {
      try {
        setRoom((await http_request.GET("/v1/room/" + params.id)) as Room);
      } catch (error) {
        throw error;
      }
    }

    getRoom();
  }, [params]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-fit py-1 rounded border-x-0 "
        >
          <div className="flex items-center space-x-3 truncate w-[18rem]">
            <Avatar>
              <AvatarImage
                src={room?.photo!.url}
                alt={room?.name.slice(0, 1).toUpperCase()}
              />
              <AvatarFallback>
                {room?.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="truncate">{room?.name}</p>
          </div>
          <ChevronUpDownIcon className="h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[17rem]">
        <DropdownMenuGroup>
          <DropdownMenuItem>invite member + </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>Change room name </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>Change room photo </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>Delete Room</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
