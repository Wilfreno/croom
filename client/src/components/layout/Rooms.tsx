"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import useServerUrl from "../hooks/useServerUrl";
import { ServerResponse } from "@/lib/types/sever-response";
import { Room } from "@/lib/types/client-types";
import { useToast } from "../ui/use-toast";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/lib/redux/store";

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { data } = useSession();
  const server_url = useServerUrl();
  const { toast } = useToast();
  const created_room = useAppSelector((state) => state.created_room_reducer);

  useEffect(() => {
    if (!data) return;
    async function getRooms() {
      try {
        const response = await fetch(
          server_url + "/v1/user/room/" + data?.user.id
        );

        const response_json = (await response.json()) as ServerResponse;

        if (response_json.status !== "OK") {
          toast({
            title: "Oops! Something went wrong",
            description: response_json.message,
          });
          return;
        }

        setRooms(response_json.data as Room[]);
      } catch (error) {
        throw error;
      }
    }

    getRooms();
  }, [data]);

  useEffect(() => {
    if (!created_room) return;

    setRooms((prev) => [...prev!, created_room]);
  }, [created_room]);
  return (
    <div
      className="overflow-y-auto max-h-[27rem] scroll-m-0 scroll-p-0 w-full"
      style={{
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      <div className="space-y-2 w-full">
        {rooms.map((room) => (
          <Link
            href={"/room/" + room.id + "/lounge/text-chat"}
            as={"/room/" + room.id + "/lounge/text-chat"}
            prefetch
            key={room.id}
          >
            <Button
              variant="outline"
              className="p-0 aspect-square h-auto w-full relative font-bold text-xl"
            >
              {room.room_photo!.photo_url ? (
                <Image
                  src={room.room_photo.photo_url}
                  alt={room.room_name.slice(0, 1).toUpperCase()}
                  height={room.room_photo.height}
                  width={room.room_photo.width}
                  className="aspect-square w-full h-auto object-cover"
                />
              ) : (
                room.room_name.slice(0, 1).toUpperCase()
              )}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
