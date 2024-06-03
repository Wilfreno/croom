import LoadingSvg from "@/components/svg/LoadingSvg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FriendRequestMessageType } from "@/lib/types/websocket-type";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

export default function FriendsRequestList({
  request,
  index,
  accept,
  decline,
}: {
  request: FriendRequestMessageType;
  index: number;
  accept: (
    sender: FriendRequestMessageType["sender"],
    index: number
  ) => Promise<void>;
  decline: (
    sender: FriendRequestMessageType["sender"],
    index: number
  ) => Promise<void>;
}) {
  const [loading, setLoading] = useState({ accept: false, decline: false });

  return (
    <li className="rounded-lg hover:bg-accent list-none p-2 flex items-center justify-between space-x-10">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="flex items-center space-x-5 grow bg-transparent justify-start text-secondary-foreground hover:bg-transparent hover:shadow-none shadow-none focus-visible:ring-0">
            <Avatar>
              <AvatarImage
                src={request.sender.profile_photo?.photo_url}
                alt={request.sender.display_name!.slice(0, 1).toUpperCase()}
              />
              <AvatarFallback>
                {request.sender.display_name!.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p>{request.sender.display_name}</p>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <p>hello</p>
        </DialogContent>
      </Dialog>
      <div className="flex imtex-center space-x-3">
        <Button
          className="h-fit w-auto bg-green-600 p-2 text-secondary-foreground"
          onClick={async () => {
            setLoading((prev) => ({ ...prev, accept: true }));
            await accept(request.sender, index);
            setLoading((prev) => ({ ...prev, accept: false }));
          }}
        >
          {loading.accept ? (
            <LoadingSvg className="h-6 fill-secondary-foreground" />
          ) : (
            <>
              <CheckIcon className="h-4" />
              Accept
            </>
          )}
        </Button>
        <Button
          className="h-fit w-auto bg-red-600 p-2 text-secondary-foreground"
          onClick={async () => {
            setLoading((prev) => ({ ...prev, decline: true }));
            await decline(request.sender, index);
            setLoading((prev) => ({ ...prev, decline: false }));
          }}
        >
          {loading.decline ? (
            <LoadingSvg className="h-6 fill-secondary-foreground" />
          ) : (
            <>
              <XMarkIcon className="h-4" />
              Decline
            </>
          )}
        </Button>
      </div>
    </li>
  );
}
