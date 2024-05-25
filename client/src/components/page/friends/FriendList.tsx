import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/lib/types/user-type";
import { ChatBubbleOvalLeftIcon, EllipsisVerticalIcon } from "@heroicons/react/24/solid";

export default function FriendList({ friend }: { friend: User }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-5">
        <Avatar>
          <AvatarImage
            src={friend.profile_pic.photo_url}
            alt={friend.display_name.slice(0, 1).toUpperCase()}
          />
          <AvatarFallback>
            {friend.display_name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p>{friend.display_name}</p>
      </div>
      <div className="flex imtex-center space-x-3">
        <Button variant="ghost" size="icon">
          <ChatBubbleOvalLeftIcon className="h-6" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <EllipsisVerticalIcon className="h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                Invite to group chat
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-600">
                Unfriend
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
