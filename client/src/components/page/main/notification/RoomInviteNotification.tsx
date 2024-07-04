import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoomInvite } from "@/lib/types/client-types";
import Link from "next/link";

export default function RoomInviteNotification({
  room_invite,
}: {
  room_invite: RoomInvite;
}) {
  return (
    <Link
      href={
        "/room/" + room_invite.room_id + "/invite?room_code=" + room_invite.code
      }
    >
      <Avatar>
        <AvatarImage
          src={room_invite.room?.photo?.url}
          alt={room_invite.room?.name.slice(0, 1).toUpperCase()}
        />
        <AvatarFallback>
          {room_invite.room?.name.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <p>
        you are invited to join <strong>{room_invite.room?.name}</strong>
      </p>
    </Link>
  );
}
