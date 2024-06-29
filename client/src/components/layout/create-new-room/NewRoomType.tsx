import { Button } from "@/components/ui/button";
import { setNewRoom } from "@/lib/redux/slices/new-room-slice";
import { AppDispatch, useAppSelector } from "@/lib/redux/store";
import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction } from "react";
import { useDispatch } from "react-redux";

export default function NewRoomType({
  component_view,
  setComponentView,
}: {
  component_view: number;
  setComponentView: Dispatch<SetStateAction<number>>;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const new_room = useAppSelector((state) => state.new_room_reducer);

  return (
    <div className={cn("w-full space-y-5", component_view !== 1 && "hidden")}>
      <p className="text-sm text-center">
        A room is where you and your friends can hangout. Tell us how others can
        join your room.
      </p>
      <div className="space-y-3">
        <Button
          type="submit"
          variant="outline"
          className="w-full h-fit justify-start py-2"
          onClick={() => {
            dispatch(setNewRoom({ ...new_room, type: "PRIVATE" }));
            setComponentView(1);
          }}
        >
          <div className="text-start">
            <p className="font-bold">Private</p>
            <p className="text-xs">
              users can only join the room through an invite
            </p>
          </div>
        </Button>
        <Button
          type="submit"
          variant="outline"
          className="w-full h-fit justify-start py-2"
          onClick={() => {
            dispatch(setNewRoom({ ...new_room, type: "PUBLIC" }));
            setComponentView(1);
          }}
        >
          <div className="text-start">
            <p className="font-bold">Public</p>
            <p className="text-xs">Any user can join</p>
          </div>
        </Button>
      </div>
      <Button
        type="button"
        variant="link"
        onClick={() => setComponentView((prev) => prev - 1)}
      >
        Back
      </Button>
    </div>
  );
}
