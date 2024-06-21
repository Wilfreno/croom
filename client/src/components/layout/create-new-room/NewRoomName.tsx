"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function NewRoomName() {
  const { data } = useSession();
  const [name, setName] = useState("");

  useEffect(() => {
    setName(data?.user.display_name + "'s room");
  }, [data]);

  return (
    <div className="space-y-3">
      <Label htmlFor="room-name" className="font-bold">
        Room name
      </Label>
      <Input
        id="room-name"
        placeholder="room name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        className="text-base py-2"
      />
    </div>
  );
}
