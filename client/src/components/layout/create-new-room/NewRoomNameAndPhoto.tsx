import { Dispatch, SetStateAction } from "react";
import NewRoomPhoto from "./NewRoomPhoto";
import NewRoomName from "./NewRoomName";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NewRoomNameAndPhoto({
  component_view,
  setComponentView,
}: {
  component_view: number;
  setComponentView: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className={cn("space-y-5", component_view !== 0 && "hidden")}>
      <p className="text-sm text-center">
        A room is where you and your friends can hangout. Give it a personality
        with a name and a photo
      </p>
      <NewRoomPhoto />
      <NewRoomName />
      <div className="flex items-center justify-end mt-10 ">
        <Button
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
