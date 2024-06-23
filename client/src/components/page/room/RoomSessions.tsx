import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/solid";

export default function RoomSessions() {
  return (
    <div>
      <div className="flex items-center w-full px-5  justify-between">
        <p className="font-bold">Room Sessions</p>
        <Button variant="ghost" className="aspect-square h-fit w-auto p-1">
          <PlusIcon className="h-5" />
        </Button>
      </div>
    </div>
  );
}
