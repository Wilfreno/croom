"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setNewRoom } from "@/lib/redux/slices/new-room-slice";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export default function NewRoomName() {
  const { data } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const new_room = useAppSelector((state) => state.new_room);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(data?.user.display_name + "'s room");
    dispatch(
      setNewRoom({
        ...new_room,
        name: data?.user.display_name + "'s room",
      })
    );
  }, [data]);

  return (
    <div className="flex flex-col items-start space-y-3">
      <Label htmlFor="room-name" className="font-bold mx-3">
        Room name
      </Label>
      <Input
        id="room-name"
        placeholder="room name"
        value={name}
        onChange={(e) => {
          setName(e.currentTarget.value);
          dispatch(setNewRoom({ ...new_room, name: e.currentTarget.value }));
        }}
        className="h-10"
      />
    </div>
  );
}
