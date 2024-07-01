import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AddRoomUserViaUsername() {
  return (
    <form className="space-y-3">
      <div>
        <Label htmlFor="room-invite" className="font-bold text-lg">
          Invite user
        </Label>
        <p className="text-xs "> invite user with their username</p>
      </div>
      <div className="flex items-center space-x-5">
        <Input id="room-invite" placeholder="username" className="h-10" />
        <Button type="button">invite</Button>
      </div>
    </form>
  );
}
