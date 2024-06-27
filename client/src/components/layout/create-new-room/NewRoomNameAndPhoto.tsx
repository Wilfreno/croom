"use client";

import { Dispatch, SetStateAction } from "react";
import NewRoomPhoto from "./NewRoomPhoto";
import NewRoomName from "./NewRoomName";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/redux/store";

export default function NewRoomNameAndPhoto({
  component_view,
  setComponentView,
}: {
  component_view: number;
  setComponentView: Dispatch<SetStateAction<number>>;
}) {
  const new_room = useAppSelector((state) => state.new_room_reducer);

  return (
    <div className={cn("space-y-5", component_view !== 0 && "hidden")}>
      <p className="text-sm text-center">
        A room is where you and your friends can hangout. Give it a personality
        with a name and a photo
      </p>
      <NewRoomPhoto />
      <NewRoomName />
      {!new_room.name && (
        <p className="text-xs text-red-500"> Room name is required</p>
      )}
      <div className="flex items-center justify-end mt-10 ">
        <Button
          disabled={!new_room.name}
          type="button"
          onClick={() => setComponentView((prev) => prev + 1)}
          className="text-secondary-foreground"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
