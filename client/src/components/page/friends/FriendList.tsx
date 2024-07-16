import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { setOnlineFriends } from "@/lib/redux/slices/online-friends-slice";
import { AppDispatch } from "@/lib/redux/store";
import { WebsocketUserType } from "@/lib/types/websocket-type";
import {
  ChatBubbleOvalLeftIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export default function FriendList({ friend }: { friend: WebsocketUserType }) {
  const dispatch = useDispatch<AppDispatch>();
  const { data } = useSession();
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const http_request = useHTTPRequest();

  async function unfriend() {
    try {
      await http_request.DELETE("/v1/friend", {
        user_1_id: data?.user.id,
        user_2_id: friend.id,
      });
      dispatch(setOnlineFriends({ operation: "remove", content: friend }));
      router.refresh();
    } catch (error) {
      throw error;
    }
  }

  return (
    <ul className="flex items-center space-x-5 list-none hover:bg-accent group rounded-lg p-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="justify-start space-x-5 grow hover:bg-transparent"
          >
            <Avatar>
              <AvatarImage
                src={friend.profile_photo?.url}
                alt={friend.display_name?.slice(0, 1).toUpperCase()}
              />
              <AvatarFallback className="group-hover:bg-background">
                {friend.display_name?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p>{friend.display_name}</p>
          </Button>
        </DialogTrigger>
        <DialogContent>hey</DialogContent>
      </Dialog>
      <div className="flex text-center space-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={"/" + params.username + "/dm/" + friend.id}
                as={"/" + params.username + "/dm/" + friend.id}
                prefetch
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-background"
                >
                  <ChatBubbleOvalLeftIcon className="h-6" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Direct message</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-background">
              <EllipsisVerticalIcon className="h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer">
                Invite to group chat
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={unfriend}
              >
                Unfriend
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </ul>
  );
}
