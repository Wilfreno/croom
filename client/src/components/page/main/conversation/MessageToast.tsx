import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Message } from "@/lib/types/server-data-types";
import { UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";
import { toast } from "sonner";

export default function MessageToast({
  message,
  toast_id,
}: {
  message: Message;
  toast_id: string | number;
}) {
  const display_name = useMemo(() => {
    let name = message.conversation.nicknames.find(
      (nickname) => nickname.user === message.sender.id
    )?.value;

    if (!name) name = message.sender.display_name;

    return name;
  }, [message]);

  return (
    <div className=" p-2 rounded-lg w-full relative group">
      <div className="flex items-start gap-2">
        <Avatar>
          <AvatarImage src={message.sender.photo?.url} />
          <AvatarFallback>
            <UserRound className="h-1/2 w-auto" />
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          className="aspect-square h-fit w-auto p-1 absolute top-1 right-2"
          onClick={() => toast.dismiss(toast_id)}
        >
          <X className="h-4 w-auto" />
        </Button>
        <Link
          href={"/conversation/" + message.conversation.id}
          target="_blank"
          className="hidden group-hover:inline-flex absolute bottom-2 right-8"
        >
          <Button size="sm" variant="secondary">
            view
          </Button>
        </Link>
        <div className="grid items-start w-full max-h-[50dvh] overflow-y-auto overflow-x-hidden">
          <p className="text-sm font-medium">{display_name}</p>
        </div>
        <span className="text-xs pl-1 ">
          {message.photos.length > 1 ? " Sent some photos" : message.text}
        </span>
      </div>
      {message.photos.length === 1 && (
        <div className="relative aspect-video w-full h-auto mt-2">
          <Image
            src={message.photos[0]?.url}
            height={message.photos[0]?.height}
            width={message.photos[0]?.width}
            className="object-cover w-full h-auto"
            alt=""
          />
        </div>
      )}
    </div>
  );
}
