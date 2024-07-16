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
import { useToast } from "@/components/ui/use-toast";
import { FriendRequest, Notification } from "@/lib/types/client-types";
import websocketMessage from "@/lib/websocket-message";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddFriend() {
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);

  const websocket = useWebsocket();
  const { data } = useSession();
  const http_request = useHTTPRequest();
  const { toast } = useToast();
  const router = useRouter();

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

              const notification = (await http_request.POST(
                "/v1/notification",
                {
                  type: "FRIEND_REQUEST",
                  friend_request_id: friend_request.id,
                  receiver_id: friend_request.receiver?.id,
                }
              )) as Notification;

              websocket?.send(websocketMessage("notification", notification));

              toast({ title: "Friend request sent" });
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
