import useServerUrl from "@/components/hooks/useServerUrl";
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
import { ServerResponse } from "@/lib/types/sever-response";
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
  const server_url = useServerUrl();
  const { data } = useSession();
  const { toast } = useToast();
  const params = useParams<{ username: string }>();
  const router = useRouter();

  async function unfriend() {
    const response = await fetch(server_url + "/v1/delete/friend", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        friend_1: data?.user.id,
        friend_2: friend.user.id,
      }),
    });

    const response_json = (await response.json()) as ServerResponse;

    if (response_json.status !== "OK") {
      toast({
        title: "Something went wrong",
        description: response_json.message,
      });
      return;
    }

    dispatch(setOnlineFriends({ operation: "remove", content: friend }));
    router.refresh();
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
                src={friend.user.profile_photo?.photo_url}
                alt={friend.user.display_name?.slice(0, 1).toUpperCase()}
              />
              <AvatarFallback className="group-hover:bg-background">
                {friend.user.display_name?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p>{friend.user.display_name}</p>
          </Button>
        </DialogTrigger>
        <DialogContent>hey</DialogContent>
      </Dialog>
      <div className="flex text-center space-x-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={"/" + params.username + "/dm/" + friend.user.id}
                as={"/" + params.username + "/dm/" + friend.user.id}
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
