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

export default function   AddFriend() {
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [server_response, setServerResponse] = useState<ServerResponse>();

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
          <DialogDescription>Add friend with their username</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSending(true);

            const friend_request = (await http_request.POST(
              "/v1/friend-request",
              {
                sender: data?.user.user_name,
                receiver: username,
              }
            )) as FriendRequest;

            setSending(false);
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
          {server_response && (
            <p
              className={cn(
                "text-xs mx-3 my-1",
                server_response.status === "OK"
                  ? "text-green-600 text-xs"
                  : "text-red-600"
              )}
            >
              {server_response.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
