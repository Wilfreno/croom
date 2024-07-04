import useHTTPRequest from "@/components/hooks/useHTTPRequest";
import { useWebsocket } from "@/components/hooks/useWebsocket";
import LoadingSvg from "@/components/svg/LoadingSvg";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FriendRequest } from "@/lib/types/client-types";
import { ServerResponse } from "@/lib/types/sever-response";
import { WebsocketFriendRequestType } from "@/lib/types/websocket-type";
import { cn } from "@/lib/utils";
import websocketMessage from "@/lib/websocket-message";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function AddFriend() {
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);

  const websocket = useWebsocket();
  const { data } = useSession();
  const http_request = useHTTPRequest();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="text-secondary-foreground">
          Add friend
        </Button>
      </DialogTrigger>
      <DialogContent className="space-y-5">
        <DialogHeader className="relative">
          <DialogClose className="absolute -top-2 -right-2">
            <XMarkIcon className="h-5 " />
          </DialogClose>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>Add friend with username</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            try {
              e.preventDefault();
              setSending(true);

              const friend_request = (await http_request.POST(
                "/v1/friend-request",
                {
                  sender: data?.user.user_name,
                  receiver: username,
                }
              )) as FriendRequest;

              websocket?.send(
                websocketMessage("send-friend-request", {
                  receiver_id: friend_request.receiver_id,
                  sender_id: data!.user.id,
                } as WebsocketFriendRequestType)
              );
              setSending(false);
            } catch (error) {
              setSending(false);
              throw error;
            }
          }}
          autoComplete="off"
        >
          <div className="flex bg-primary-foreground rounded-lg p-2">
            <Input
              placeholder="Add friend with their username"
              id="username"
              className="border-none bg-transparent focus-visible:ring-0"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button type="submit" disabled={!username} className="w-2/3">
              {sending ? <LoadingSvg className="h-6" /> : "Send Friend request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
