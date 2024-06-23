"use client";

import useServerUrl from "@/components/hooks/useServerUrl";
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
  const server_url = useServerUrl();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();

  const [room, setRoom] = useState<Room>();

  useEffect(() => {
    if (!params.id) return;
    async function getRoom() {
      try {
        const response = await fetch(server_url + "/v1/room/" + params.id);

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! something went wrong",
            description: response_json.message,
          });
          return;
        }

        setRoom(response_json.data as Room);
      } catch (error) {
        throw error;
      }
    }

    getRoom();
  }, [params]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full h-fit py-1">
          <div className="flex items-center space-x-3 truncate w-[18rem]">
            <Avatar>
              <AvatarImage
                src={room?.room_photo.photo_url}
                alt={room?.room_name.slice(0, 1).toUpperCase()}
              />
              <AvatarFallback>
                {room?.room_name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="truncate">{room?.room_name}</p>
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
