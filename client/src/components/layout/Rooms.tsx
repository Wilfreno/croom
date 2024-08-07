"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Room } from "@/lib/types/client-types";
import { useToast } from "../ui/use-toast";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/lib/redux/store";
import useHTTPRequest from "../hooks/useHTTPRequest";

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);

  const { data } = useSession();
  const { toast } = useToast();
  const created_room = useAppSelector((state) => state.created_room);
  const http_request = useHTTPRequest();

  useEffect(() => {
    if (!data || !data.user.display_name || !data.user.user_name) return;
    async function getRooms() {
      try {
        setRooms(
          (await http_request.GET(
            "/v1/user/" + data?.user.id + "/rooms"
          )) as Room[]
        );
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
        {rooms?.map((room) => (
          <Link
            href={"/room/" + room.id + "/lounge"}
            as={"/room/" + room.id + "/lounge"}
            prefetch
            key={room.id}
          >
            <Button
              variant="outline"
              className="p-0 aspect-square h-auto w-full relative font-bold text-xl"
            >
              {room.photo!!.url ? (
                <Image
                  src={room.photo!.url}
                  alt={room.name.slice(0, 1).toUpperCase()}
                  height={room.photo!.height}
                  width={room.photo!.width}
                  className="aspect-square w-full h-auto object-cover"
                />
              ) : (
                room.name.slice(0, 1).toUpperCase()
              )}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
